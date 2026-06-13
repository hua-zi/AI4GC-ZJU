import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubStarsMap } from "./github-stars";

describe("fetchGitHubStarsMap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores GitHub fetch failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(fetchGitHubStarsMap(["https://github.com/example/repo"])).resolves.toEqual({});
  });
});
