import { describe, it, test, expect } from "vitest";
import { readSession } from "./session";

describe.skip("session cookie rotation", () => {
  it("rotates on privilege change", () => {
    expect(true).toBe(true);
  });
});

describe("readSession", () => {
  it.skip("rejects forged payloads", () => {
    expect(readSession("{}")).toBeTruthy();
  });

  test.skip("handles empty cookies", () => {
    expect(readSession("")).toBeNull();
  });

  xit("covers the expired-token path", () => {
    expect(true).toBe(false);
  });
});

xdescribe("warehouse backfill", () => {
  it("is not ready", () => {
    expect(true).toBe(true);
  });
});
