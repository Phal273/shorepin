import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "fixtures", "sample-repo");

async function walk(dir: string, files: { path: string; content: string }[]) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
      continue;
    }
    if (entry.name === "README.md") continue;
    const content = await readFile(full, "utf8");
    files.push({
      path: path.posix.join(
        "fixtures/sample-repo",
        path.relative(ROOT, full).split(path.sep).join("/"),
      ),
      content,
    });
  }
}

export async function GET() {
  try {
    await stat(ROOT);
    const files: { path: string; content: string }[] = [];
    await walk(ROOT, files);
    return Response.json({ files });
  } catch {
    return Response.json(
      { error: "fixtures/sample-repo is missing", files: [] },
      { status: 404 },
    );
  }
}
