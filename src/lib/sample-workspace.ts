import type { SourceFile } from "./scanner";

export const SAMPLE_NOTE =
  "Five files from fixtures/sample-repo. Intentional escapes only. Nothing here is seeded company data.";

export async function loadSampleWorkspace(): Promise<SourceFile[]> {
  const urls = ["/sample-workspace.json", "/api/fixtures"];
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`Could not load ${url}`);
        continue;
      }
      const body = (await response.json()) as { files?: SourceFile[] };
      if (body.files && body.files.length > 0) return body.files;
      lastError = new Error("Sample workspace was empty");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Sample load failed");
    }
  }

  throw lastError ?? new Error("Could not load fixtures/sample-repo");
}
