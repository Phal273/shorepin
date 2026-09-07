import type { SourceFile } from "./scanner";

export const SAMPLE_NOTE =
  "Five files from fixtures/sample-repo. Intentional escapes only. Nothing here is seeded company data.";

export async function loadSampleWorkspace(): Promise<SourceFile[]> {
  const response = await fetch("/api/fixtures");
  if (!response.ok) {
    throw new Error("Could not load fixtures/sample-repo");
  }
  const body = (await response.json()) as { files?: SourceFile[] };
  return body.files ?? [];
}
