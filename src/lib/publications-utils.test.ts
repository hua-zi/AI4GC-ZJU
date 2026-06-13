import { describe, expect, it } from "vitest";
import { normalizeVenueLabel, parsePublicationVenue } from "@/lib/publications-utils";

describe("normalizeVenueLabel", () => {
  it("collapses arXiv preprint journal strings", () => {
    expect(normalizeVenueLabel("arXiv preprint arXiv:2602.01725")).toBe("arXiv");
  });

  it("leaves conference venues unchanged", () => {
    expect(normalizeVenueLabel("CVPR")).toBe("CVPR");
  });
});

describe("parsePublicationVenue", () => {
  it("parses arXiv venue with year", () => {
    expect(parsePublicationVenue("arXiv 2026")).toEqual({
      conference: "arXiv",
      year: "2026",
      honor: null,
    });
  });
});
