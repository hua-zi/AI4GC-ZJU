import { describe, expect, it } from "vitest";
import {
  normalizeBlogAuthorIds,
  resolveBlogAuthorLabel,
} from "@/lib/content/blog-authors";

describe("normalizeBlogAuthorIds", () => {
  it("merges authorId and authorIds with deduplication", () => {
    expect(
      normalizeBlogAuthorIds({
        authorId: "yurun-chen-2025-12551024",
        authorIds: ["yurun-chen-2025-12551024", "shengyu-zhang"],
      }),
    ).toEqual(["yurun-chen-2025-12551024", "shengyu-zhang"]);
  });

  it("trims and drops empty values", () => {
    expect(
      normalizeBlogAuthorIds({
        authorIds: ["  alice  ", "", "  "],
      }),
    ).toEqual(["alice"]);
  });
});

describe("resolveBlogAuthorLabel", () => {
  it("prefers explicit author label", () => {
    expect(
      resolveBlogAuthorLabel("Guest Author", [{ id: "a", name: "Alice" }]),
    ).toBe("Guest Author");
  });

  it("joins member names when author label is omitted", () => {
    expect(
      resolveBlogAuthorLabel(undefined, [
        { id: "a", name: "Alice" },
        { id: "b", name: "Bob", profileHref: "/bob" },
      ]),
    ).toBe("Alice, Bob");
  });
});
