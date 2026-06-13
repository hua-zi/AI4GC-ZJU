"use client";

import { type MouseEvent, type SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";

import MarkdownBody from "@/components/markdown/MarkdownBody";

type AdminFileEntry = {
  path: string;
  name: string;
  kind: "file" | "directory";
  section: string;
  size?: number;
  updatedAt?: string;
  draft?: boolean;
  localUrl?: string;
};

type FilesPayload = {
  root: string;
  entries: AdminFileEntry[];
};

type FileTreeNode = {
  name: string;
  path: string;
  kind: "file" | "directory";
  children: FileTreeNode[];
  file?: AdminFileEntry;
};

type PendingUpload = {
  id: string;
  file: File;
  path: string;
  localUrl: string;
  dest: string;
};

type PendingEntry = AdminFileEntry & {
  draft: true;
};

type ContextMenuState = {
  x: number;
  y: number;
  target: string;
  filePath?: string;
};

const EDITABLE_EXTENSIONS = [".yaml", ".yml", ".md", ".bib", ".txt", ".json"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];

function isEditable(path: string) {
  return EDITABLE_EXTENSIONS.some((extension) => path.toLowerCase().endsWith(extension));
}

function isImage(path: string) {
  return IMAGE_EXTENSIONS.some((extension) => path.toLowerCase().endsWith(extension));
}

function fileTypeLabel(path: string) {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".md")) return "Markdown";
  if (lowerPath.endsWith(".bib")) return "BibTeX";
  if (lowerPath.endsWith(".yaml") || lowerPath.endsWith(".yml")) return "YAML";
  if (lowerPath.endsWith(".json")) return "JSON";
  if (isImage(path)) return "Image";
  return "File";
}

function clientSafeFilename(name: string) {
  return name.split(/[/\\]/).filter(Boolean).at(-1) ?? "upload.bin";
}

function clientSafeRelativePath(name: string) {
  return name
    .split(/[/\\]/)
    .filter(Boolean)
    .map(clientSafeFilename)
    .join("/");
}

function contentAssetUrl(path: string) {
  if (path.startsWith("assets/")) {
    return `/content-assets/${path.slice("assets/".length)}`;
  }
  if (path.startsWith("blog/")) {
    const [, slug, ...fileParts] = path.split("/");
    if (slug && fileParts.length > 0) {
      return `/blog-assets/${slug}/${fileParts.join("/")}`;
    }
  }
  if (path.startsWith("team/")) {
    const [, group, member, ...fileParts] = path.split("/");
    if (group && member && fileParts.length > 0) {
      return `/team-assets/${group}/${member}/${fileParts.join("/")}`;
    }
  }
  if (path.startsWith("home/modules/")) {
    const [, , moduleId, ...fileParts] = path.split("/");
    if (moduleId && fileParts.length > 0) {
      return `/home-assets/${moduleId}/${fileParts.join("/")}`;
    }
  }
  return path;
}

function formatBytes(size?: number) {
  if (typeof size !== "number") {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
}

function uploadDestForContext(selectedPath: string) {
  if (selectedPath.startsWith("assets/")) {
    const parts = selectedPath.split("/");
    return parts.length > 2 ? parts.slice(0, -1).join("/") : "assets";
  }

  if (selectedPath.startsWith("blog/")) {
    const [, slug] = selectedPath.split("/");
    return slug ? `blog/${slug}` : "blog";
  }

  if (selectedPath.startsWith("team/")) {
    const [root, group, member] = selectedPath.split("/");
    if (root && group && member) {
      return `${root}/${group}/${member}`;
    }
    return "team";
  }

  if (selectedPath.startsWith("home/")) {
    const parts = selectedPath.split("/");
    return parts.length > 2 ? parts.slice(0, -1).join("/") : "home";
  }

  return "assets";
}

function contentPathForUpload(dest: string, filename: string) {
  const normalizedDest = dest.replace(/^\/+/, "");

  if (normalizedDest === "assets") {
    return `assets/${filename}`;
  }

  if (normalizedDest.startsWith("assets/")) {
    return `assets/${normalizedDest.slice("assets/".length)}/${filename}`;
  }

  if (normalizedDest.startsWith("team-assets/")) {
    return `team/${normalizedDest.slice("team-assets/".length)}/${filename}`;
  }

  if (normalizedDest.startsWith("team/") || normalizedDest.startsWith("blog/")) {
    return `${normalizedDest}/${filename}`;
  }

  if (normalizedDest.startsWith("home/")) {
    return `${normalizedDest}/${filename}`;
  }

  return `assets/${filename}`;
}

function sectionForPath(filePath: string) {
  if (filePath === "site.yaml") return "site";
  if (filePath === "publications.bib") return "publications";
  if (filePath.startsWith("home/") || filePath === "home.yaml") return "home";
  return filePath.split("/")[0] || "assets";
}

function sortTreeNodes(nodes: FileTreeNode[]) {
  nodes.sort((first, second) => {
    if (first.kind !== second.kind) {
      return first.kind === "directory" ? -1 : 1;
    }
    return first.name.localeCompare(second.name);
  });

  nodes.forEach((node) => sortTreeNodes(node.children));
}

function buildFileTree(files: AdminFileEntry[], baseRoot: string) {
  const root: FileTreeNode[] = [];

  files.forEach((file) => {
    const displayPath = baseRoot && file.path.startsWith(`${baseRoot}/`) ? file.path.slice(baseRoot.length + 1) : file.path;
    const parts = displayPath.split("/").filter(Boolean);
    let siblings = root;
    let fullPathPrefix = baseRoot;

    parts.forEach((part, index) => {
      const isLeaf = index === parts.length - 1;
      const fullPath = fullPathPrefix ? `${fullPathPrefix}/${part}` : part;
      const nodeKind = isLeaf ? file.kind : "directory";
      let node = siblings.find((item) => item.name === part && item.kind === nodeKind);

      if (!node) {
        node = {
          name: isLeaf ? file.name : part,
          path: isLeaf ? file.path : fullPath,
          kind: nodeKind,
          children: [],
          file: isLeaf ? file : undefined,
        };
        siblings.push(node);
      }

      siblings = node.children;
      fullPathPrefix = fullPath;
    });
  });

  sortTreeNodes(root);
  return root;
}

function sitePreviewHref(filePath: string) {
  if (!filePath) {
    return "/";
  }

  if (filePath === "site.yaml" || filePath.startsWith("home/") || filePath === "home.yaml") {
    return "/";
  }

  if (filePath === "publications.bib") {
    return "/publications";
  }

  if (filePath.startsWith("news/")) {
    return "/news";
  }

  if (filePath.startsWith("blog/")) {
    const [, slug] = filePath.split("/");
    return slug ? `/blog/${slug}` : "/blog";
  }

  if (filePath.startsWith("team/")) {
    const [, , member] = filePath.split("/");
    return member ? `/${member}` : "/team";
  }

  if (filePath.startsWith("assets/")) {
    return contentAssetUrl(filePath);
  }

  return "/";
}

export default function ContentFileConsole() {
  const [entries, setEntries] = useState<AdminFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [previewPath, setPreviewPath] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(["assets", "blog", "team"]));
  const [viewMode, setViewMode] = useState<"edit" | "site" | "markdown">("edit");
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadDest, setUploadDest] = useState("assets");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadPickerDestRef = useRef("assets");
  const pendingUploadsRef = useRef<PendingUpload[]>([]);

  const entriesWithDraft = useMemo(() => {
    if (pendingUploads.length === 0 && pendingEntries.length === 0) {
      return entries;
    }

    const draftEntries = pendingUploads.map((upload) => ({
      path: upload.path,
      name: clientSafeFilename(upload.file.name),
      kind: "file" as const,
      section: sectionForPath(upload.path),
      size: upload.file.size,
      draft: true,
      localUrl: upload.localUrl,
    }));
    const drafts = [...pendingEntries, ...draftEntries];

    return [
      ...entries.filter((entry) => !drafts.some((draft) => draft.path === entry.path)),
      ...drafts,
    ];
  }, [entries, pendingEntries, pendingUploads]);

  const fileTree = useMemo(() => buildFileTree(entriesWithDraft, ""), [entriesWithDraft]);

  const currentFilePath = selectedPath || previewPath;
  const currentPreviewHref = sitePreviewHref(currentFilePath);
  const currentFile = entriesWithDraft.find((entry) => entry.path === currentFilePath);
  const isGuidanceSelected = currentFilePath === "guidance.md";
  const currentImageSrc = currentFilePath && !isGuidanceSelected && isImage(currentFilePath) ? (currentFile?.localUrl ?? contentAssetUrl(currentFilePath)) : "";
  const hasLocalFileDraft = pendingEntries.some((entry) => entry.kind === "file" && entry.path === selectedPath);
  const hasContentChanges = Boolean(selectedPath) && (content !== savedContent || hasLocalFileDraft);
  const canSave = hasContentChanges || pendingUploads.length > 0 || pendingEntries.length > 0;

  function resetPreviewState() {
    setPreviewLoaded(false);
    setPreviewFailed(false);
  }

  function toggleExpanded(path: string) {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function openContextMenu(event: MouseEvent<HTMLElement>, target: string, filePath?: string) {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = target || "assets";
    setUploadDest(nextTarget);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: nextTarget,
      filePath,
    });
  }

  function openUploadPicker(kind: "files" | "folder") {
    uploadPickerDestRef.current = contextMenu?.target ?? uploadDest;
    setContextMenu(null);
    if (kind === "files") {
      fileInputRef.current?.click();
      return;
    }
    folderInputRef.current?.click();
  }

  function draftChildPath(target: string, name: string) {
    const safeName = clientSafeRelativePath(name);
    if (!safeName) {
      return "";
    }
    return target ? `${target.replace(/\/+$/, "")}/${safeName}` : safeName;
  }

  function hasEntry(path: string) {
    return entriesWithDraft.some((entry) => entry.path === path);
  }

  function stageNewFile() {
    const target = contextMenu?.target ?? uploadDest;
    const name = window.prompt("New file name", "new-file.md")?.trim();
    if (!name) {
      setContextMenu(null);
      return;
    }

    const path = draftChildPath(target, name);
    if (!path || !isEditable(path)) {
      setError("New file must use an editable extension: .yaml, .yml, .md, .bib, .txt, or .json.");
      setContextMenu(null);
      return;
    }

    if (hasEntry(path)) {
      setError(`A file or folder already exists at ${path}.`);
      setContextMenu(null);
      return;
    }

    const draft: PendingEntry = {
      path,
      name: clientSafeFilename(path),
      kind: "file",
      section: sectionForPath(path),
      size: 0,
      draft: true,
    };

    setPendingEntries((current) => [...current, draft]);
    setPreviewPath(path);
    setSelectedPath(path);
    setContent("");
    setSavedContent("");
    setViewMode("edit");
    setStatus(`Draft file: ${path}. Save to write it into content/.`);
    setError(null);
    setContextMenu(null);
  }

  function stageNewFolder() {
    const target = contextMenu?.target ?? uploadDest;
    const name = window.prompt("New folder name", "new-folder")?.trim();
    if (!name) {
      setContextMenu(null);
      return;
    }

    const path = draftChildPath(target, name);
    if (!path) {
      setContextMenu(null);
      return;
    }

    if (hasEntry(path)) {
      setError(`A file or folder already exists at ${path}.`);
      setContextMenu(null);
      return;
    }

    const draft: PendingEntry = {
      path,
      name: clientSafeFilename(path),
      kind: "directory",
      section: sectionForPath(path),
      draft: true,
    };

    setPendingEntries((current) => [...current, draft]);
    setExpandedPaths((current) => new Set(current).add(path));
    setUploadDest(path);
    setStatus(`Draft folder: ${path}. Save to write it into content/.`);
    setError(null);
    setContextMenu(null);
  }

  function handlePreviewLoad(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;

    window.setTimeout(() => {
      const documentBody = frame.contentDocument?.body;
      const hasRenderableContent = Boolean(documentBody && documentBody.childElementCount > 0);

      setPreviewLoaded(true);
      setPreviewFailed(!hasRenderableContent);
    }, 80);
  }

  async function loadFiles() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/files");
    setLoading(false);

    if (!response.ok) {
      setError("Failed to load content files.");
      return;
    }

    const payload = (await response.json()) as FilesPayload;
    setEntries(payload.entries);
  }

  async function openFile(path: string) {
    setPreviewPath(path);
    setUploadDest(uploadDestForContext(path));
    resetPreviewState();

    const pendingEntry = pendingEntries.find((entry) => entry.path === path);
    if (pendingEntry?.kind === "file") {
      setSelectedPath(path);
      setContent("");
      setSavedContent("");
      setViewMode("edit");
      setStatus(`Draft file: ${path}. Save to write it into content/.`);
      setError(null);
      return;
    }

    if (pendingUploads.some((upload) => upload.path === path)) {
      setSelectedPath("");
      setContent("");
      setSavedContent("");
      setViewMode("site");
      setStatus(`Local draft: ${path}. Save to write it into content/.`);
      setError(null);
      return;
    }

    if (!isEditable(path)) {
      setSelectedPath("");
      setContent("");
      setSavedContent("");
      setViewMode("site");
      setStatus(null);
      setError(null);
      return;
    }

    setSelectedPath(path);
    setViewMode(path === "guidance.md" ? "markdown" : "edit");
    setStatus(null);
    setError(null);
    const response = await fetch(`/api/admin/files?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Failed to read file.");
      return;
    }

    const payload = (await response.json()) as { content: string };
    setContent(payload.content);
    setSavedContent(payload.content);
  }

  async function saveFile() {
    if (!canSave) {
      setError("Select a file first.");
      return;
    }

    setSaving(true);
    setStatus(null);
    setError(null);

    if (selectedPath && hasContentChanges) {
      const response = await fetch("/api/admin/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedPath, content }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaving(false);
        setError(payload?.error ?? "Save failed.");
        return;
      }
    }

    for (const entry of pendingEntries.filter((entry) => entry.path !== selectedPath)) {
      const response =
        entry.kind === "directory"
          ? await fetch("/api/admin/files", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: entry.path, kind: "directory" }),
            })
          : await fetch("/api/admin/files", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: entry.path, content: "" }),
            });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaving(false);
        setError(payload?.error ?? `Save failed: ${entry.path}`);
        return;
      }
    }

    for (const upload of pendingUploads) {
      const formData = new FormData();
      formData.append("file", upload.file);

      const response = await fetch(`/api/admin/upload?dest=${encodeURIComponent(upload.dest)}`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { path?: string; error?: string } | null;
      if (!response.ok) {
        setSaving(false);
        setError(payload?.error ?? `Upload failed: ${upload.path}`);
        return;
      }
    }

    pendingUploads.forEach((upload) => URL.revokeObjectURL(upload.localUrl));
    const savedCount = Number(Boolean(selectedPath && hasContentChanges)) + pendingEntries.filter((entry) => entry.path !== selectedPath).length + pendingUploads.length;
    setPendingEntries([]);
    setPendingUploads([]);
    setSaving(false);
    setStatus(`Saved ${savedCount} change${savedCount === 1 ? "" : "s"} to content/.`);
    resetPreviewState();
    setPreviewVersion((version) => version + 1);
    await loadFiles();
  }

  async function deleteFile(path: string) {
    if (pendingEntries.some((entry) => entry.path === path)) {
      discardPendingEntry(path);
      return;
    }

    if (pendingUploads.some((upload) => upload.path === path)) {
      discardPendingUpload(path);
      return;
    }

    if (!window.confirm(`Delete ${path}?`)) {
      return;
    }

    const response = await fetch(`/api/admin/files?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Delete failed.");
      return;
    }

    setStatus(`Deleted ${path}`);
    if (selectedPath === path) {
      setSelectedPath("");
      setContent("");
    }
    if (previewPath === path) {
      setPreviewPath("");
    }
    await loadFiles();
  }

  function stageUploads(filesToStage: File[], destination = uploadDest) {
    const dest = destination.trim();
    if (!dest) {
      setError("Enter an upload destination.");
      return;
    }

    if (filesToStage.length === 0) {
      return;
    }

    pendingUploads.forEach((upload) => URL.revokeObjectURL(upload.localUrl));

    const drafts = filesToStage.map((file, index) => {
      const rawRelativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name || `upload-${index}`;
      const safeRelativePath = clientSafeRelativePath(rawRelativePath) || clientSafeFilename(file.name || `upload-${index}`);
      const relativeParts = safeRelativePath.split("/").filter(Boolean);
      const subdir = relativeParts.slice(0, -1).join("/");
      const uploadDest = subdir ? `${dest.replace(/\/+$/, "")}/${subdir}` : dest;

      return {
        id: `${safeRelativePath}-${file.size}-${file.lastModified}-${index}`,
        file,
        path: contentPathForUpload(dest, safeRelativePath),
        localUrl: URL.createObjectURL(file),
        dest: uploadDest,
      };
    });

    setPendingUploads(drafts);
    setPreviewPath(drafts[0]?.path ?? "");
    setSelectedPath("");
    setContent("");
    setSavedContent("");
    setViewMode("site");
    resetPreviewState();
    setStatus(`Added ${drafts.length} local draft${drafts.length === 1 ? "" : "s"}. Save to write into content/.`);
    setError(null);
  }

  function discardPendingUpload(path: string) {
    const upload = pendingUploads.find((item) => item.path === path);
    if (!upload) {
      return;
    }

    URL.revokeObjectURL(upload.localUrl);
    const remaining = pendingUploads.filter((item) => item.path !== path);
    if (previewPath === path) {
      setPreviewPath("");
    }
    setPendingUploads(remaining);
    setStatus(`Discarded local draft ${path}.`);
  }

  function discardPendingEntry(path: string) {
    setPendingEntries((current) => current.filter((entry) => entry.path !== path && !entry.path.startsWith(`${path}/`)));
    if (previewPath === path || previewPath.startsWith(`${path}/`)) {
      setPreviewPath("");
    }
    if (selectedPath === path || selectedPath.startsWith(`${path}/`)) {
      setSelectedPath("");
      setContent("");
      setSavedContent("");
    }
    setStatus(`Discarded local draft ${path}.`);
  }

  function renderTree(nodes: FileTreeNode[], depth = 0) {
    return nodes.map((node) => {
      if (node.kind === "directory") {
        const isExpanded = expandedPaths.has(node.path);

        return (
          <div key={node.path} className="admin-file-tree__group">
            <button
              type="button"
              className="admin-file-tree__directory"
              style={{ paddingLeft: `${0.75 + depth * 0.9}rem` }}
              onContextMenu={(event) => openContextMenu(event, node.path || "assets")}
              onClick={() => {
                toggleExpanded(node.path);
                setUploadDest(node.path || "assets");
              }}
            >
              <span
                className={
                  isExpanded
                    ? "admin-file-tree__chevron admin-file-tree__chevron--open"
                    : "admin-file-tree__chevron"
                }
                aria-hidden="true"
              />
              <strong>
                {node.name}
                {node.file?.draft ? <em>Draft</em> : null}
              </strong>
            </button>
            {isExpanded ? renderTree(node.children, depth + 1) : null}
          </div>
        );
      }

      const file = node.file;
      if (!file) {
        return null;
      }

      return (
        <div
          key={file.path}
          className={previewPath === file.path ? "admin-list__row admin-list__row--active" : "admin-list__row"}
          style={{ marginLeft: `${depth * 0.9}rem` }}
          onContextMenu={(event) => openContextMenu(event, uploadDestForContext(file.path), file.path)}
        >
          <button type="button" className="admin-list__item" title={file.path} onClick={() => void openFile(file.path)}>
            <strong>
              {node.name}
              {file.draft ? <em>Draft</em> : null}
            </strong>
            <span className="admin-list__meta">
              <small>{fileTypeLabel(file.path)}</small>
              <small>{isEditable(file.path) ? formatBytes(file.size) : "Asset"}</small>
            </span>
          </button>
          <button type="button" className="admin-list__delete" onClick={() => void deleteFile(file.path)}>
            {file.draft ? "Discard" : "Delete"}
          </button>
        </div>
      );
    });
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/files")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load content files.");
        }
        return (await response.json()) as FilesPayload;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setEntries(payload.entries);
        const guidanceEntry = payload.entries.find((entry) => entry.path === "guidance.md");
        if (guidanceEntry) {
          setSelectedPath(guidanceEntry.path);
          setPreviewPath(guidanceEntry.path);
          setViewMode("markdown");
          fetch(`/api/admin/files?path=${encodeURIComponent(guidanceEntry.path)}`)
            .then(async (response) => {
              if (!response.ok) {
                throw new Error("Failed to load guidance.");
              }
              return (await response.json()) as { content: string };
            })
            .then((filePayload) => {
              if (cancelled) {
                return;
              }
              setContent(filePayload.content);
              setSavedContent(filePayload.content);
            })
            .catch(() => {
              if (!cancelled) {
                setError("Failed to load guidance.");
              }
            });
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setError("Failed to load content files.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    pendingUploadsRef.current = pendingUploads;
  }, [pendingUploads]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function closeContextMenu() {
      setContextMenu(null);
    }

    function closeContextMenuFromKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("keydown", closeContextMenuFromKey);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
      window.removeEventListener("keydown", closeContextMenuFromKey);
    };
  }, [contextMenu]);

  useEffect(() => {
    return () => {
      pendingUploadsRef.current.forEach((upload) => URL.revokeObjectURL(upload.localUrl));
    };
  }, []);

  return (
    <section className="admin-file-console">
      <div className="admin-file-console__grid">
        <div className="admin-file-console__files">
          <input
            ref={fileInputRef}
            className="admin-file-console__hidden-input"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files ?? []);
              stageUploads(selectedFiles, uploadPickerDestRef.current);
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={folderInputRef}
            className="admin-file-console__hidden-input"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files ?? []);
              stageUploads(selectedFiles, uploadPickerDestRef.current);
              event.currentTarget.value = "";
            }}
          />
          <div className="admin-list admin-file-list" onContextMenu={(event) => openContextMenu(event, uploadDest)}>
            <div className="admin-file-list__title">content</div>
            {loading ? <p className="admin-list__empty">Loading files…</p> : null}
            {!loading && entriesWithDraft.length === 0 ? <p className="admin-list__empty">No files.</p> : null}
            {renderTree(fileTree)}
          </div>
        </div>

        <main className="admin-file-console__workspace">
          <div className="admin-file-console__workspace-header">
            <div>
              <strong>
                {currentFilePath || "Select a content file"}
                {hasContentChanges ? <em className="admin-file-console__dirty">Unsaved</em> : null}
              </strong>
              <p className="admin-card__hint">
                {selectedPath && hasContentChanges
                  ? "Unsaved edits are local until you save."
                  : isGuidanceSelected
                    ? "Guidance opens as Markdown preview by default. Switch to Edit to update it."
                    : "Preview follows the selected file’s site route. Uploads stay drafts until saved."}
              </p>
            </div>
            <div className="admin-file-console__workspace-actions">
              <div className="admin-file-console__view-switch" aria-label="Editor view mode">
                <button
                  type="button"
                  className={viewMode === "edit" ? "admin-file-console__view-button admin-file-console__view-button--active" : "admin-file-console__view-button"}
                  disabled={!selectedPath}
                  onClick={() => setViewMode("edit")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={viewMode !== "edit" ? "admin-file-console__view-button admin-file-console__view-button--active" : "admin-file-console__view-button"}
                  onClick={() => {
                    if (viewMode === "edit") {
                      resetPreviewState();
                    }
                    setViewMode(isGuidanceSelected ? "markdown" : "site");
                  }}
                >
                  Preview
                </button>
              </div>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => {
                  resetPreviewState();
                  setPreviewVersion((version) => version + 1);
                  void loadFiles();
                }}
              >
                Refresh
              </button>
              <button type="button" className="admin-button" disabled={saving || !canSave} onClick={() => void saveFile()}>
                {saving ? "Saving…" : pendingUploads.length > 0 && !selectedPath ? "Save drafts" : hasContentChanges ? "Save changes" : "No changes"}
              </button>
            </div>
          </div>
          {viewMode === "edit" ? (
            <textarea
              className="admin-code admin-file-console__textarea"
              value={content}
              placeholder="Select a content file."
              spellCheck={false}
              onChange={(event) => {
                setContent(event.target.value);
              }}
            />
          ) : viewMode === "markdown" ? (
            <div className="admin-file-console__markdown-preview">
              <MarkdownBody content={content || "Select a Markdown file."} variant="blog" />
            </div>
          ) : (
            currentImageSrc ? (
              <div className="admin-file-console__image-preview">
                <div className="admin-file-console__site-preview-bar">
                  <span>{currentImageSrc}</span>
                </div>
                <div className="admin-file-console__image-stage">
                  <div className="admin-file-console__image-canvas" style={{ backgroundImage: `url(${currentImageSrc})` }} />
                </div>
              </div>
            ) : (
              <div className="admin-file-console__site-preview">
                <div className="admin-file-console__site-preview-bar">
                  <span>
                    <strong>Route</strong>
                    {currentPreviewHref}
                  </span>
                </div>
                {!previewLoaded || previewFailed ? (
                  <div className={previewFailed ? "admin-file-console__preview-state admin-file-console__preview-state--error" : "admin-file-console__preview-state"}>
                    <strong>{previewFailed ? "Preview failed" : "Loading preview…"}</strong>
                    <span>{previewFailed ? "Reload the preview or open the page after saving content changes." : currentPreviewHref}</span>
                  </div>
                ) : null}
                <iframe
                  key={`${currentPreviewHref}-${previewVersion}`}
                  className="admin-file-console__site-frame"
                  src={currentPreviewHref}
                  title="Website preview"
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                  onLoad={handlePreviewLoad}
                  onError={() => {
                    setPreviewLoaded(true);
                    setPreviewFailed(true);
                  }}
                />
              </div>
            )
          )}
        </main>
      </div>

      {contextMenu ? (
        <div
          className="admin-context-menu"
          role="menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="admin-context-menu__target">{contextMenu.target}</div>
          <button type="button" role="menuitem" onClick={stageNewFile}>
            New File
          </button>
          <button type="button" role="menuitem" onClick={stageNewFolder}>
            New Folder
          </button>
          <span className="admin-context-menu__divider" />
          <button type="button" role="menuitem" onClick={() => openUploadPicker("files")}>
            Upload Files
          </button>
          <button type="button" role="menuitem" onClick={() => openUploadPicker("folder")}>
            Upload Folder
          </button>
          {contextMenu.filePath ? (
            <>
              <span className="admin-context-menu__divider" />
              <button
                type="button"
                role="menuitem"
                className="admin-context-menu__danger"
                onClick={() => {
                  const { filePath } = contextMenu;
                  if (!filePath) {
                    return;
                  }
                  setContextMenu(null);
                  void deleteFile(filePath);
                }}
              >
                {pendingUploads.some((upload) => upload.path === contextMenu.filePath) ? "Discard draft" : "Delete file"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <footer
        className={error ? "admin-file-console__footer admin-file-console__footer--error" : "admin-file-console__footer"}
        aria-live="polite"
      >
        <span>{error ?? status ?? "Ready"}</span>
        <span className="admin-file-console__footer-meta">
          <span>
            Selected <strong>{currentFilePath || "none"}</strong>
          </span>
          <span>
            Upload target <code>{uploadDest}</code>
          </span>
        </span>
      </footer>
    </section>
  );
}
