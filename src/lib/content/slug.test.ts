import { describe, expect, it } from "vitest";
import { formatMemberStartMeta } from "@/lib/content/slug";

describe("formatMemberStartMeta", () => {
  it("prefixes start date with group label", () => {
    expect(formatMemberStartMeta("2025", "Enrolled")).toBe("Enrolled · 2025");
    expect(formatMemberStartMeta("2024", "Joined")).toBe("Joined · 2024");
  });

  it("returns date only when label is omitted", () => {
    expect(formatMemberStartMeta("2025")).toBe("2025");
  });
});
