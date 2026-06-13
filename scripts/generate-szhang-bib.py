#!/usr/bin/env python3
"""Generate publications.bib from fetched Google Scholar markdown pages."""

import re
from pathlib import Path

PAGES = [
    Path("/Users/yurunchen/.cursor/projects/Users-yurunchen-project-github-page-ai-website-cloner/agent-tools/a658271f-9cc0-4faf-b2dc-50e153d9e908.txt"),
]

# Titles to exclude: medical/clinical, non-research, wrong author match
EXCLUDE_TITLE_PATTERNS = [
    r"paclitaxel",
    r"tacrolimus",
    r"kidney transplant",
    r"membranous nephropathy",
    r"clinical pharmacist",
    r"carbapenems",
    r"beers criteria",
    r"inappropriate medication",
    r"potentially inappropriate",
    r"di'ao xinxuekang",
    r"4-amino-2-trifluoromethyl",
    r"mgc80-3",
    r"prescription administrative policy",
    r"multidisciplinary collaborative prescription",
]

# Skip student abstracts and workshop-only entries
SKIP_TITLE_PATTERNS = [
    r"\(student abstract\)",
    r"CEFSW'25",
]

NON_ENGLISH_TITLE_PATTERNS = [
    r"[^\x00-\x7F]",
]

VENUE_MAP = [
    (r"Advances in Neural Information Processing Systems", "NeurIPS"),
    (r"Proceedings of the ACM Web Conference", "WWW"),
    (r"Proceedings of the ACM on Web Conference", "WWW"),
    (r"Companion Proceedings of the ACM Web Conference", "WWW"),
    (r"Proceedings of the AAAI Conference on Artificial Intelligence", "AAAI"),
    (r"Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern", "CVPR"),
    (r"Proceedings of the 33rd ACM International Conference on Multimedia", "ACM MM"),
    (r"Proceedings of the 32nd ACM International Conference on Multimedia", "ACM MM"),
    (r"Proceedings of the 31st ACM international conference on multimedia", "ACM MM"),
    (r"Proceedings of the 31st ACM SIGKDD Conference", "KDD"),
    (r"Proceedings of the 30th ACM SIGKDD Conference", "KDD"),
    (r"Proceedings of the 63rd Annual Meeting of the Association for Computational", "ACL"),
    (r"Proceedings of the 61st Annual Meeting of the Association for Computational", "ACL"),
    (r"The Thirteenth International Conference on Learning Representations", "ICLR"),
    (r"European Conference on Computer Vision", "ECCV"),
    (r"Proceedings of the Thirty-Fourth International Joint Conference on", "IJCAI"),
    (r"Proceedings of the 19th Conference of the European Chapter of the", "EACL"),
    (r"Proceedings of the 6th ACM International Conference on Multimedia in Asia", "ACM MM Asia"),
    (r"ICASSP \d{4}", "ICASSP"),
    (r"ICLR", "ICLR"),
    (r"IEEE Transactions on Cybernetics", "IEEE Transactions on Cybernetics"),
    (r"IEEE Transactions on Multimedia", "IEEE Transactions on Multimedia"),
    (r"IEEE Transactions on Knowledge and Data Engineering", "IEEE TKDE"),
    (r"ACM Transactions on Information Systems", "ACM TOIS"),
    (r"ACM Computing Surveys", "ACM Computing Surveys"),
    (r"Engineering \d+", "Engineering"),
    (r"Nexus", "Nexus"),
    (r"Frontiers of Information Technology & Electronic Engineering", "FITEE"),
    (r"TechRxiv", "TechRxiv"),
    (r"Journal of Computer Research and Development", "JCRD"),
    (r"中国图象图形学报", "CJIG"),
    (r"中国工程科学", "Engineering Sciences China"),
]


def slugify(title: str, year: str) -> str:
    words = re.findall(r"[a-z0-9]+", title.lower())
    stop = {"a", "an", "the", "for", "of", "in", "on", "via", "with", "and", "to"}
    core = [w for w in words if w not in stop][:4]
    base = "".join(core) or "paper"
    return f"{base}{year}"


def normalize_venue(raw: str) -> tuple[str, str, str | None]:
    """Return (entry_type, venue_field, arxiv_url)."""
    arxiv_match = re.search(r"arXiv[:\s]*(\d{4}\.\d{4,5})", raw, re.I)
    if arxiv_match or "arxiv" in raw.lower():
        arxiv_id = arxiv_match.group(1) if arxiv_match else None
        url = f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else None
        return "article", "arXiv", url

    for pattern, label in VENUE_MAP:
        if re.search(pattern, raw, re.I):
            if label in ("IEEE Transactions on Cybernetics", "IEEE Transactions on Multimedia", "IEEE TKDE", "ACM TOIS", "ACM Computing Surveys", "Engineering", "Nexus", "FITEE", "TechRxiv", "JCRD", "CJIG", "Engineering Sciences China"):
                return "article", label, None
            return "inproceedings", label, None

    if "IEEE Transactions" in raw or "ACM Transactions" in raw:
        journal = raw.split(",")[0].strip()
        return "article", journal, None

    return "misc", raw.split(",")[0].strip(), None


def is_noise(line: str) -> bool:
    if not line or line.startswith("‪"):
        return True
    noise = {
        "Loading...",
        "Sort",
        "Sort by citations Sort by year Sort by title",
        "Cited by",
        "The system can't perform the operation now. Try again later.",
        "Show more",
        "Articles 1–100",
        "Articles 21–120",
        "Articles 101–157",
    }
    if line in noise:
        return True
    if "Verified email" in line or "Zhejiang University" in line:
        return True
    if line.startswith("Shengyu Zhang") and "张圣宇" in line:
        return True
    return False


def next_nonempty(lines: list[str], start: int) -> int | None:
    for j in range(start, len(lines)):
        if lines[j]:
            return j
    return None


def parse_entries(text: str) -> list[dict]:
    lines = [ln.strip() for ln in text.splitlines()]
    entries = []
    i = 0
    while i < len(lines):
        if is_noise(lines[i]):
            i += 1
            continue

        title_idx = i
        author_idx = next_nonempty(lines, title_idx + 1)
        if author_idx is None:
            break
        venue_idx = next_nonempty(lines, author_idx + 1)
        if venue_idx is None:
            break

        title = lines[title_idx]
        authors = lines[author_idx]
        venue_line = lines[venue_idx]

        if is_noise(title) or is_noise(authors):
            i += 1
            continue

        year_match = re.search(r"\b((19|20)\d{2})\b", venue_line)
        if not year_match:
            i += 1
            continue

        # Authors line should look like a author list, not a venue
        if not re.search(
            r"[A-Z][a-z]+.*,|ZHANG|Zhang|Shengyu|张圣宇|，|[A-Z]{2,}\s+[A-Z]",
            authors,
        ):
            i += 1
            continue

        truncated = authors.rstrip().endswith("...")
        clean_authors = authors.replace("...", "").strip().rstrip(",")

        entries.append({
            "title": title,
            "authors": clean_authors,
            "venue_raw": venue_line,
            "year": year_match.group(1),
            "truncated_authors": truncated,
        })
        i = venue_idx + 1
    return entries


def has_profile_authorship(entry: dict) -> bool:
    authors = entry["authors"]
    if re.search(r"\bS Zhang\b|Shengyu Zhang|Z Shengyu|S ZHANG|张圣宇", authors):
        return True
    return entry.get("truncated_authors", False)


def should_exclude(entry: dict) -> bool:
    title_lower = entry["title"].lower()
    for pat in EXCLUDE_TITLE_PATTERNS + SKIP_TITLE_PATTERNS + NON_ENGLISH_TITLE_PATTERNS:
        if re.search(pat, title_lower, re.I):
            return True
    return not has_profile_authorship(entry)


def dedupe_key(entry: dict) -> str:
    title = re.sub(r"[^a-z0-9]", "", entry["title"].lower())
    # normalize known duplicates
    aliases = {
        "cascadedselfevaluationaugmentedtrainingforlightweightmultimodalllms": "cascadedselfeval",
        "cascadedselfevaluationaugmentedtrainingforefficientmultimodallargelanguagemodels": "cascadedselfeval",
        "osagentsasurveyonmllmbasedagentsforgeneralcomputingdevicesuse": "osagents",
        "osagentsasurveyonmllmbasedagentsforcomputerphoneandbrowseruse": "osagents",
        "ecoagentanefficientdevicecloudcollaborativemultiagentframeworkformobileautomation": "ecoagent",
        "aeiamnevaluatingtherobustnessofmultimodalllmpoweredmobileagentsagainstactiveenvironmentalinjectionattacks": "aeiamn",
        "evaluatingtherobustnessofmultimodalagentsagainstactiveenvironmentalinjectionattacks": "aeiamn",
        "instructiontuningforlargelanguagemodelsasurvey": "instructiontuning",
        "instructiontuningforlargelanguagemodelsasurvey2024": "instructiontuning",
        "fedmconanadaptiveaggregationmethodforfederatedlearningviametacontroller": "fedmcon",
        "anadaptiveaggregationmethodforfederatedlearningviametacontroller": "fedmconasia",
    }
    norm = re.sub(r"[^a-z0-9]", "", title)
    return aliases.get(norm, norm[:60])


def prefer_entry(existing: dict, new: dict) -> dict:
    """Prefer published venue over arXiv; prefer longer author list; prefer newer year label."""
    def score(e: dict) -> tuple:
        raw = e["venue_raw"].lower()
        published = 0 if "arxiv" in raw or "url http" in raw else 2
        if "proceedings" in raw or "conference" in raw:
            published += 3
        if "transactions" in raw or "computing surveys" in raw:
            published += 2
        return (published, len(e["authors"]), int(e["year"]))

    return new if score(new) > score(existing) else existing


def format_bib_entry(entry: dict, key: str) -> str:
    entry_type, venue, url = normalize_venue(entry["venue_raw"])
    if not url:
        arxiv_match = re.search(r"arXiv[:\s]*(\d{4}\.\d{4,5})", entry["venue_raw"], re.I)
        if arxiv_match:
            url = f"https://arxiv.org/abs/{arxiv_match.group(1)}"

    lines = [f"@{entry_type}{{{key},"]
    lines.append(f"  title={{{entry['title']}}},")
    lines.append(f"  author={{{entry['authors']}}},")
    lines.append(f"  year={{{entry['year']}}},")

    if entry_type == "article" and venue == "arXiv":
        lines.append("  journal={arXiv},")
    elif entry_type == "inproceedings":
        lines.append(f"  booktitle={{{venue}}},")
    elif entry_type == "article":
        lines.append(f"  journal={{{venue}}},")
    else:
        lines.append(f"  howpublished={{{venue}}},")

    if url:
        lines.append(f"  url={{{url}}},")

    lines.append("}")
    return "\n".join(lines)


def main():
    all_entries = []
    for page in PAGES:
        all_entries.extend(parse_entries(page.read_text(encoding="utf-8")))

    filtered = [e for e in all_entries if int(e["year"]) >= 2025 and not should_exclude(e)]

    deduped: dict[str, dict] = {}
    for e in filtered:
        k = dedupe_key(e)
        if k in deduped:
            deduped[k] = prefer_entry(deduped[k], e)
        else:
            deduped[k] = e

    # Sort by year desc, then title
    final = sorted(deduped.values(), key=lambda x: (-int(x["year"]), x["title"].lower()))

    used_keys: set[str] = set()
    blocks = [
        "% publications.bib — Shengyu Zhang (张圣宇) Google Scholar profile l4Dyt7EAAAAJ",
        "% Auto-generated from Scholar list (2025+). Edit manually as needed.",
        "",
    ]

    for e in final:
        key = slugify(e["title"], e["year"])
        base = key
        n = 2
        while key in used_keys:
            key = f"{base}{n}"
            n += 1
        used_keys.add(key)
        blocks.append(format_bib_entry(e, key))
        blocks.append("")

    out = Path("/Users/yurunchen/project/github_page/ai-website-cloner/content/publications.bib")
    out.write_text("\n".join(blocks), encoding="utf-8")
    print(f"Wrote {len(final)} entries to {out}")


if __name__ == "__main__":
    main()
