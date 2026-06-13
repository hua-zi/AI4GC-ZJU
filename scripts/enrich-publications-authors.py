#!/usr/bin/env python3
"""Enrich content/publications.bib: full author names, paper links, GitHub repos.

Lookup order per entry:
1. arXiv API (batched when possible) — authors + abs url
2. Semantic Scholar Graph API — authors, url, doi, GitHub externalIds
3. CrossRef — authors + doi fallback
4. Known lab title→GitHub map (papers.bib, lab content)
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BIB_PATH = ROOT / "content" / "publications.bib"
PAPERS_BIB_GLOB = ROOT / "content" / "team"
ARXIV_BATCH_SIZE = 20
ARXIV_DELAY_SEC = 0.4
SEMANTIC_DELAY_SEC = 0.5
OPENALEX_DELAY_SEC = 0.3
TITLE_MATCH_THRESHOLD = 0.85
SS_MAX_RETRIES = 3
ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}
USER_AGENT = "ai-website-cloner/1.0 (publication enrichment script)"
SEMANTIC_DISABLED = False

# Conservative title→GitHub map (verified lab repos only)
EXTRA_KNOWN_GITHUB: dict[str, str] = {
    "acckvtowardsefficientaudiovideollmsinferenceviaadaptivefocusingandcrosscalibrationkvcacheoptimization": "https://github.com/hua-zi/AccKV",
    "autogeoautomatinggeometricimagedatasetcreationforenhancedgeometryunderstanding": "https://autogeo-official.github.io/",
    "cuffkttacklinglearnersrealtimelearningpatternadjustmentviatuningfreeknowledgestateguidedmodelupdating": "https://github.com/zyy-2001/Cuff-KT",
    "infiguiagentamultimodalgeneralistguiagentwithnativereasoningandreflection": "https://github.com/InfiXAI/InfiGUIAgent",
    "infiguir1advancingmultimodalguiagentsfromreactiveactorstodeliberativereasoners": "https://github.com/InfiXAI/InfiGUI-R1",
    "infiguig1advancingguigroundingwithadaptiveexplorationpolicyoptimization": "https://github.com/InfiXAI/InfiGUI-G1",
    "ecoagentanefficientdevicecloudcollaborativemultiagentframeworkformobileautomation": "https://github.com/InfiXAI/EcoAgent",
    "ecoagentanefficientedgecloudcollaborativemultiagentframeworkformobileautomation": "https://github.com/InfiXAI/EcoAgent",
    "ecdifffastandhighqualityedgecloudcollaborativeinferencefordiffusionmodels": "https://ec-diff.github.io/",
    "ecofaceaudiovisualemotionalcodisentanglementspeechdriven3dtalkingfacegeneration": "https://github.com/EcoFace1/EcoFace1.github.io",
    "disentangledknowledgetracingforalleviatingcognitivebias": "https://github.com/zyy-2001/DisKT",
    "infircraftingeffectivesmalllanguagemodelsandmultimodalsmalllanguagemodelsinreasoning": "https://github.com/Reallm-Labs/InfiR",
    "msbenchevaluatinglmmsinancientmanuscriptstudythroughadunhuangcasestudy": "https://github.com/ianeong/MS-Bench",
    "osagentsasurveyonmllmbasedagentsforcomputerphoneandbrowseruse": "https://github.com/OS-Agent-Survey/OS-Agent-Survey",
    "rastprepresentationawaresemantictokenpruningforgenerativerecommendationwithsemanticidentifiers": "https://github.com/Yuzt-zju/RASTP",
    "thinkrecthinkingbasedrecommendationviallm": "https://anonymous.4open.science/r/ThinkRec_LLM",
}

# Conservative title→paper map for venues not reliably found by public APIs.
EXTRA_KNOWN_PAPER_URL: dict[str, str] = {
    "ecofaceaudiovisualemotionalcodisentanglementspeechdriven3dtalkingfacegeneration": "https://openreview.net/forum?id=iDcWYtYUwX",
    "msbenchevaluatinglmmsinancientmanuscriptstudythroughadunhuangcasestudy": "https://openreview.net/forum?id=mPznBXZSWf",
}

EXTRA_KNOWN_AUTHORS: dict[str, str] = {
    "cascadedselfevaluationaugmentedtrainingforlightweightmultimodalllms": "Zheqi Lv and Wenkai Wang and Jiawei Wang and Shengyu Zhang and Fei Wu",
    "ecofaceaudiovisualemotionalcodisentanglementspeechdriven3dtalkingfacegeneration": "Jiajian Xie and Shengyu Zhang and Mengze Li and Chengfei Lv and Zhou Zhao and Fei Wu",
    "mixtureofreasoningsteachlargelanguagemodelstoreasonwithadaptivestrategies": "Tao Xiong and Xavier Hu and Wenyan Fan and Shengyu Zhang",
    "msbenchevaluatinglmmsinancientmanuscriptstudythroughadunhuangcasestudy": "Yuqing Zhang and Yue Han and Shuanghe Zhu and Haoxiang Wu and Hangqi Li and Shengyu Zhang and Junchi Yan and Zemin Liu and Kun Kuang and Huaiyong Dou and Yongquan Zhang and Fei Wu",
}


@dataclass
class PaperMeta:
    authors: list[str] | None = None
    url: str | None = None
    doi: str | None = None
    github: str | None = None
    source: str | None = None


@dataclass
class BibEntry:
    key: str
    raw_block: str
    title: str
    author: str
    url: str | None = None
    doi: str | None = None
    github: str | None = None
    fields: dict[str, str] = field(default_factory=dict)


@dataclass
class Stats:
    authors_enriched: int = 0
    urls_added: int = 0
    dois_added: int = 0
    github_added: int = 0
    unchanged: int = 0
    arxiv_hits: int = 0
    semantic_hits: int = 0
    openalex_hits: int = 0
    crossref_hits: int = 0
    failures: list[str] = field(default_factory=list)
    samples: list[tuple[str, dict, dict]] = field(default_factory=list)


def normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", title.lower())


def title_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_title(a), normalize_title(b)).ratio()


def log(msg: str) -> None:
    print(msg, flush=True)


def fetch_url(url: str, max_retries: int = 5) -> str | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < max_retries - 1:
                time.sleep(min(60, 2**attempt * 5))
                continue
            return None
        except (urllib.error.URLError, TimeoutError, OSError):
            if attempt < max_retries - 1:
                time.sleep(1 + attempt)
                continue
            return None
    return None


def is_abbreviated_author(name: str) -> bool:
    name = name.strip()
    if not name:
        return True
    if name.isupper() and " " in name:
        return True
    parts = name.split()
    if len(parts) < 2:
        return True
    first = parts[0].rstrip(".")
    if len(first) == 1 and first.isalpha() and first.isupper():
        return True
    if re.match(r"^[A-Z]\.$", parts[0]):
        return True
    return False


def split_author_string(author_str: str) -> list[str]:
    separator = " and " if " and " in author_str else ","
    return [author.strip() for author in author_str.split(separator) if author.strip()]


def authors_are_abbreviated(author_str: str) -> bool:
    authors = split_author_string(author_str)
    return not authors or any(is_abbreviated_author(author) for author in authors)


def is_valid_person_name(name: str) -> bool:
    name = name.strip()
    if not name or len(name) < 3:
        return False
    lower = name.lower()
    institution_markers = (
        "association",
        "proceedings",
        "conference",
        "journal",
        "arxiv",
        "ieee",
        "acm",
        "springer",
        "elsevier",
        "university",
        "institute",
        "laboratory",
        "research",
        "intelligence 20",
        "artificial intelligence 20",
    )
    if any(marker in lower for marker in institution_markers):
        return False
    if re.search(r"\b(19|20)\d{2}\b", name):
        return False
    parts = name.split()
    if len(parts) < 2:
        return False
    return not is_abbreviated_author(name)


def filter_valid_authors(names: list[str]) -> list[str]:
    return [n.strip() for n in names if is_valid_person_name(n.strip())]


def normalize_author_string(author_str: str) -> str:
    author_str = author_str.strip()
    if " and " in author_str:
        return author_str
    parts = [p.strip() for p in author_str.split(",") if p.strip()]
    return " and ".join(parts)


def authors_need_enrichment(author_str: str) -> bool:
    if not author_str.strip():
        return True
    if "Association for" in author_str:
        return True
    return authors_are_abbreviated(author_str)


def format_authors(names: list[str]) -> str:
    """BibTeX author lists must use ``and`` — commas mean Last, First pairs."""
    return " and ".join(filter_valid_authors(names))


def extract_arxiv_id_from_text(text: str | None) -> str | None:
    if not text:
        return None
    match = re.search(r"arxiv\.org/abs/(\d{4}\.\d{4,5})", text, re.I)
    if match:
        return match.group(1)
    match = re.search(r"\barXiv[:\s]*(\d{4}\.\d{4,5})\b", text, re.I)
    return match.group(1) if match else None


def extract_arxiv_id(entry: BibEntry) -> str | None:
    for value in (entry.url, entry.fields.get("journal"), entry.fields.get("eprint")):
        arxiv_id = extract_arxiv_id_from_text(value)
        if arxiv_id:
            return arxiv_id
    return None


def load_known_authors_map() -> dict[str, str]:
    mapping: dict[str, str] = dict(EXTRA_KNOWN_AUTHORS)
    for bib_path in PAPERS_BIB_GLOB.rglob("papers.bib"):
        text = bib_path.read_text(encoding="utf-8")
        for block in re.split(r"\n(?=@)", text):
            if not block.strip().startswith("@"):
                continue
            title_match = re.search(r"^\s*title=\{([^}]*)\}", block, re.MULTILINE)
            author_match = re.search(r"^\s*author=\{([^}]*)\}", block, re.MULTILINE)
            if title_match and author_match:
                key = normalize_title(title_match.group(1))
                authors = author_match.group(1).strip()
                if authors and not authors_are_abbreviated(authors):
                    mapping[key] = authors
    return mapping


def load_known_github_map() -> dict[str, str]:
    mapping: dict[str, str] = dict(EXTRA_KNOWN_GITHUB)
    for bib_path in PAPERS_BIB_GLOB.rglob("papers.bib"):
        text = bib_path.read_text(encoding="utf-8")
        for block in re.split(r"\n(?=@)", text):
            if not block.strip().startswith("@"):
                continue
            title_match = re.search(r"^\s*title=\{([^}]*)\}", block, re.MULTILINE)
            github_match = re.search(r"^\s*github=\{([^}]*)\}", block, re.MULTILINE)
            if title_match and github_match:
                key = normalize_title(title_match.group(1))
                url = github_match.group(1).strip()
                if url.startswith("https://github.com/"):
                    mapping[key] = url
    return mapping


def batch_fetch_arxiv(arxiv_ids: list[str]) -> dict[str, PaperMeta]:
    results: dict[str, PaperMeta] = {}
    unique_ids = list(dict.fromkeys(arxiv_ids))
    for i in range(0, len(unique_ids), ARXIV_BATCH_SIZE):
        batch = unique_ids[i : i + ARXIV_BATCH_SIZE]
        id_list = ",".join(batch)
        query_url = f"https://export.arxiv.org/api/query?id_list={id_list}"
        time.sleep(ARXIV_DELAY_SEC)
        body = fetch_url(query_url)
        if not body:
            continue
        try:
            root = ET.fromstring(body)
        except ET.ParseError:
            continue
        for entry in root.findall("atom:entry", ATOM_NS):
            id_el = entry.find("atom:id", ATOM_NS)
            if id_el is None or not id_el.text:
                continue
            arxiv_id_match = re.search(r"(\d{4}\.\d{4,5})(?:v\d+)?$", id_el.text.strip())
            if not arxiv_id_match:
                continue
            arxiv_id = arxiv_id_match.group(1)
            authors = [
                author.find("atom:name", ATOM_NS).text.strip()
                for author in entry.findall("atom:author", ATOM_NS)
                if author.find("atom:name", ATOM_NS) is not None
                and author.find("atom:name", ATOM_NS).text
            ]
            meta = PaperMeta(
                authors=filter_valid_authors(authors) or None,
                url=f"https://arxiv.org/abs/{arxiv_id}",
                source="arxiv",
            )
            results[arxiv_id] = meta
    return results


def normalize_github_url(raw: str) -> str | None:
    raw = raw.strip()
    if not raw:
        return None
    if raw.startswith("https://github.com/"):
        return raw.rstrip("/")
    if raw.startswith("github.com/"):
        return f"https://{raw.rstrip('/')}"
    match = re.match(r"^([\w.-]+)/([\w.-]+)$", raw)
    if match:
        return f"https://github.com/{match.group(1)}/{match.group(2)}"
    return None


def fetch_semantic_scholar(title: str) -> PaperMeta | None:
    global SEMANTIC_DISABLED
    if SEMANTIC_DISABLED:
        return None
    params = urllib.parse.urlencode(
        {
            "query": title,
            "fields": "title,authors,externalIds,url,openAccessPdf",
            "limit": 5,
        }
    )
    url = f"https://api.semanticscholar.org/graph/v1/paper/search?{params}"
    body = fetch_url(url, max_retries=1)
    if not body:
        SEMANTIC_DISABLED = True
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None

    papers = data.get("data") or []
    best: dict | None = None
    best_score = 0.0
    for paper in papers:
        score = title_similarity(title, paper.get("title") or "")
        if score > best_score:
            best_score = score
            best = paper

    if not best or best_score < TITLE_MATCH_THRESHOLD:
        return None

    authors = [a.get("name", "").strip() for a in best.get("authors") or [] if a.get("name")]
    external = best.get("externalIds") or {}
    doi = external.get("DOI")
    arxiv = external.get("ArXiv")
    paper_url = best.get("url")
    github_raw = external.get("GitHub") or external.get("GitHubRepo")
    github = normalize_github_url(github_raw) if github_raw else None

    abs_url: str | None = None
    if arxiv:
        abs_url = f"https://arxiv.org/abs/{arxiv}"
    elif paper_url:
        abs_url = paper_url

    return PaperMeta(
        authors=filter_valid_authors(authors) or None,
        url=abs_url,
        doi=doi,
        github=github,
        source="semantic_scholar",
    )


def fetch_openalex(title: str) -> PaperMeta | None:
    params = urllib.parse.urlencode(
        {"search": title, "per_page": 5, "select": "id,title,doi,authorships,primary_location,open_access"}
    )
    url = f"https://api.openalex.org/works?{params}"
    body = fetch_url(url, max_retries=3)
    if not body:
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None

    results = data.get("results") or []
    best: dict | None = None
    best_score = 0.0
    for item in results:
        score = title_similarity(title, item.get("title") or "")
        if score > best_score:
            best_score = score
            best = item

    if not best or best_score < TITLE_MATCH_THRESHOLD:
        return None

    names: list[str] = []
    for authorship in best.get("authorships") or []:
        author = authorship.get("author") or {}
        display = (author.get("display_name") or "").strip()
        if display:
            names.append(display)

    doi = best.get("doi")
    if doi and doi.startswith("https://doi.org/"):
        doi = doi.removeprefix("https://doi.org/")

    paper_url = None
    loc = best.get("primary_location") or {}
    if loc.get("landing_page_url"):
        paper_url = loc["landing_page_url"]
    elif doi:
        paper_url = f"https://doi.org/{doi}"

    return PaperMeta(
        authors=filter_valid_authors(names) or None,
        url=paper_url,
        doi=doi,
        source="openalex",
    )


def fetch_crossref(title: str) -> PaperMeta | None:
    params = urllib.parse.urlencode({"query.title": title, "rows": 5})
    url = f"https://api.crossref.org/works?{params}"
    body = fetch_url(url)
    if not body:
        return None
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return None

    items = data.get("message", {}).get("items") or []
    best_item: dict | None = None
    best_score = 0.0
    for item in items:
        item_title = " ".join(item.get("title") or [])
        score = title_similarity(title, item_title)
        if score > best_score:
            best_score = score
            best_item = item

    if not best_item or best_score < TITLE_MATCH_THRESHOLD:
        return None

    names: list[str] = []
    for author in best_item.get("author") or []:
        given = (author.get("given") or "").strip()
        family = (author.get("family") or "").strip()
        full = f"{given} {family}".strip()
        if full:
            names.append(full)

    doi = best_item.get("DOI")
    url_field = None
    for link in best_item.get("link") or []:
        if link.get("content-type") == "unspecified" and link.get("URL"):
            url_field = link["URL"]
            break

    return PaperMeta(
        authors=filter_valid_authors(names) or None,
        url=url_field,
        doi=doi,
        source="crossref",
    )


def parse_bib_entries(text: str) -> tuple[str, list[BibEntry]]:
    blocks = re.split(r"\n(?=@)", text)
    preamble = blocks[0]
    if preamble and not preamble.endswith("\n"):
        preamble += "\n"

    entries: list[BibEntry] = []
    for block in blocks[1:]:
        block = block.strip()
        if not block:
            continue
        if not block.startswith("@"):
            block = "@" + block

        key_match = re.match(r"@\w+\{([^,]+),", block)
        if not key_match:
            continue
        key = key_match.group(1)

        fields: dict[str, str] = {}
        for match in re.finditer(r"^\s*(\w+)\=\{([^}]*)\},?\s*$", block, re.MULTILINE):
            fields[match.group(1)] = match.group(2)

        entries.append(
            BibEntry(
                key=key,
                raw_block=block,
                title=fields.get("title", ""),
                author=fields.get("author", ""),
                url=fields.get("url"),
                doi=fields.get("doi"),
                github=fields.get("github") or fields.get("code"),
                fields=fields,
            )
        )
    return preamble, entries


def set_field(block: str, field_name: str, value: str) -> str:
    pattern = rf"^(\s*{re.escape(field_name)}=\{{)[^}}]*(\}},?\s*)$"
    if re.search(pattern, block, re.MULTILINE):
        return re.sub(
            pattern,
            lambda m: f"{m.group(1)}{value}{m.group(2)}",
            block,
            count=1,
            flags=re.MULTILINE,
        )
    lines = block.rstrip().splitlines()
    if lines and lines[-1].strip() == "}":
        lines.insert(-1, f"  {field_name}={{{value}}},")
        return "\n".join(lines)
    return block.rstrip() + f"\n  {field_name}={{{value}}},\n}}"


def merge_meta(
    entry: BibEntry, meta: PaperMeta, known_github: dict[str, str], known_authors: dict[str, str]
) -> dict[str, str | None]:
    """Return updated field values (author, url, doi, github)."""
    out = {
        "author": entry.author,
        "url": entry.url,
        "doi": entry.doi,
        "github": entry.github,
    }

    title_key = normalize_title(entry.title)
    verified_authors = known_authors.get(title_key)
    if verified_authors:
        out["author"] = normalize_author_string(verified_authors)
    elif meta.authors and authors_need_enrichment(out["author"] or ""):
        formatted = format_authors(meta.authors)
        if formatted and not authors_are_abbreviated(formatted):
            out["author"] = formatted
    else:
        out["author"] = normalize_author_string(out["author"] or "")

    if not out["url"] and meta.url:
        out["url"] = meta.url
    if not out["url"] and title_key in EXTRA_KNOWN_PAPER_URL:
        out["url"] = EXTRA_KNOWN_PAPER_URL[title_key]
    if not out["doi"] and meta.doi:
        out["doi"] = meta.doi
        if not out["url"]:
            out["url"] = f"https://doi.org/{meta.doi}"

    if not out["github"]:
        github = meta.github
        if not github:
            github = known_github.get(title_key)
        if github:
            out["github"] = github

    return out


def apply_updates(block: str, updates: dict[str, str | None]) -> str:
    result = block
    for field_name in ("author", "url", "doi", "github"):
        value = updates.get(field_name)
        if value:
            result = set_field(result, field_name, value)
    return result


def needs_remote_lookup(
    entry: BibEntry, known_github: dict[str, str], known_authors: dict[str, str]
) -> bool:
    title_key = normalize_title(entry.title)
    has_github = bool(entry.github or known_github.get(title_key))
    has_paper_link = bool(entry.url or entry.doi)
    has_full_authors = bool(known_authors.get(title_key)) or not authors_need_enrichment(entry.author)
    return not (has_github and has_paper_link and has_full_authors)


def merge_remote(base: PaperMeta, extra: PaperMeta | None) -> PaperMeta:
    if not extra:
        return base
    if not base.authors and extra.authors:
        base.authors = extra.authors
        base.source = extra.source
    if not base.url and extra.url:
        base.url = extra.url
    if not base.doi and extra.doi:
        base.doi = extra.doi
    if not base.github and extra.github:
        base.github = extra.github
    return base


def enrich_all(
    entries: list[BibEntry], known_github: dict[str, str], known_authors: dict[str, str]
) -> tuple[list[str], Stats]:
    stats = Stats()
    ss_cache: dict[str, PaperMeta | None] = {}

    arxiv_map: dict[str, str] = {}
    for entry in entries:
        arxiv_id = extract_arxiv_id(entry)
        if arxiv_id:
            arxiv_map[entry.key] = arxiv_id

    log(f"Batch arXiv lookup for {len(set(arxiv_map.values()))} ids...")
    arxiv_meta = batch_fetch_arxiv(list(arxiv_map.values()))

    updated_blocks: list[str] = []
    for idx, entry in enumerate(entries, 1):
        old = {
            "author": entry.author,
            "url": entry.url,
            "doi": entry.doi,
            "github": entry.github,
        }

        merged = PaperMeta()
        arxiv_id = arxiv_map.get(entry.key)
        if arxiv_id and arxiv_id in arxiv_meta:
            arxiv_data = arxiv_meta[arxiv_id]
            merged.authors = arxiv_data.authors
            merged.url = arxiv_data.url
            merged.source = "arxiv"
            stats.arxiv_hits += 1

        if needs_remote_lookup(entry, known_github, known_authors):
            log(f"  [{idx}/{len(entries)}] {entry.key}")
            title_key = normalize_title(entry.title)

            if not merged.url or not merged.doi or authors_need_enrichment(entry.author):
                time.sleep(OPENALEX_DELAY_SEC)
                oa_meta = fetch_openalex(entry.title)
                if oa_meta:
                    stats.openalex_hits += 1
                    merged = merge_remote(merged, oa_meta)

            still_needs = (
                authors_need_enrichment(entry.author) and not merged.authors
            ) or (not entry.url and not merged.url) or (
                not entry.github
                and not known_github.get(title_key)
                and not merged.github
            )
            if still_needs:
                if title_key not in ss_cache:
                    time.sleep(SEMANTIC_DELAY_SEC)
                    ss_cache[title_key] = fetch_semantic_scholar(entry.title)
                ss_meta = ss_cache[title_key]
                if ss_meta:
                    stats.semantic_hits += 1
                    merged = merge_remote(merged, ss_meta)

            if authors_need_enrichment(entry.author) and not merged.authors:
                time.sleep(ARXIV_DELAY_SEC)
                cr_meta = fetch_crossref(entry.title)
                if cr_meta:
                    stats.crossref_hits += 1
                    merged = merge_remote(merged, cr_meta)

        new_fields = merge_meta(entry, merged, known_github, known_authors)
        block = apply_updates(entry.raw_block, new_fields)

        author_changed = new_fields["author"] != old["author"]
        url_changed = bool(new_fields["url"]) and new_fields["url"] != old["url"]
        doi_changed = bool(new_fields["doi"]) and new_fields["doi"] != old["doi"]
        github_changed = bool(new_fields["github"]) and new_fields["github"] != old["github"]

        if author_changed:
            stats.authors_enriched += 1
        if url_changed:
            stats.urls_added += 1
        if doi_changed:
            stats.dois_added += 1
        if github_changed:
            stats.github_added += 1

        if not any((author_changed, url_changed, doi_changed, github_changed)):
            stats.unchanged += 1
            if authors_need_enrichment(entry.author) and not new_fields["url"]:
                stats.failures.append(f"{entry.key}: {entry.title[:80]}")
        elif len(stats.samples) < 3:
            stats.samples.append((entry.key, old, new_fields))

        updated_blocks.append(block)

    return updated_blocks, stats


def main() -> int:
    bib_path = BIB_PATH
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        bib_path = Path(sys.argv[1])

    text = bib_path.read_text(encoding="utf-8")
    preamble, entries = parse_bib_entries(text)
    known_github = load_known_github_map()
    known_authors = load_known_authors_map()

    log(f"Loaded {len(known_github)} known GitHub mappings")
    log(f"Loaded {len(known_authors)} verified author mappings")
    log(f"Processing {len(entries)} entries...\n")

    updated_blocks, stats = enrich_all(entries, known_github, known_authors)

    body = "\n\n".join(updated_blocks)
    bib_path.write_text(f"{preamble.rstrip()}\n\n{body}\n", encoding="utf-8")

    print(f"Processed {len(entries)} entries")
    print(f"  Authors enriched:  {stats.authors_enriched}")
    print(f"  URLs added:        {stats.urls_added}")
    print(f"  DOIs added:        {stats.dois_added}")
    print(f"  GitHub added:      {stats.github_added}")
    print(f"  Unchanged:         {stats.unchanged}")
    print(f"  arXiv lookups:     {stats.arxiv_hits}")
    print(f"  Semantic Scholar:  {stats.semantic_hits}" + (" (disabled after rate limit)" if SEMANTIC_DISABLED else ""))
    print(f"  OpenAlex:          {stats.openalex_hits}")
    print(f"  CrossRef:          {stats.crossref_hits}")
    print(f"  Failed lookups:    {len(stats.failures)}")
    print()

    if stats.samples:
        print("Sample before/after:")
        for key, before, after in stats.samples:
            print(f"  [{key}]")
            print(f"    author before: {before['author'][:100]}")
            print(f"    author after:  {after['author'][:100]}")
            print(f"    url before:    {before['url'] or '(none)'}")
            print(f"    url after:     {after['url'] or '(none)'}")
            print(f"    doi after:     {after['doi'] or '(none)'}")
            print(f"    github after:  {after['github'] or '(none)'}")
            print()

    if stats.failures:
        print("Entries that could not be fully enriched:")
        for line in stats.failures:
            print(f"  - {line}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
