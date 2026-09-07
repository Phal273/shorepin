import type { SourceFile } from "./scanner";

const HEADER =
  /^(?:---+|===+)\s*(.+?)\s*(?:---+|===+)\s*$|^(?:\/\/|#)\s*FILE:\s*(.+)\s*$/;

export function parsePastedSources(raw: string, fallbackPath = "pasted.txt"): SourceFile[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const lines = text.split("\n");
  const files: SourceFile[] = [];
  let currentPath: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentPath == null) return;
    files.push({ path: currentPath, content: buffer.join("\n") });
    buffer = [];
  };

  for (const line of lines) {
    const match = line.match(HEADER);
    if (match) {
      flush();
      currentPath = (match[1] || match[2]).trim();
      continue;
    }
    if (currentPath == null) {
      currentPath = fallbackPath;
    }
    buffer.push(line);
  }
  flush();

  return files.filter((file) => file.content.trim().length > 0);
}

export async function filesFromFileList(list: FileList | File[]): Promise<SourceFile[]> {
  const files = Array.from(list);
  const sources: SourceFile[] = [];
  for (const file of files) {
    const path =
      "webkitRelativePath" in file && file.webkitRelativePath
        ? file.webkitRelativePath
        : file.name;
    if (file.size > 1_500_000) continue;
    const content = await file.text();
    sources.push({ path, content });
  }
  return sources;
}
