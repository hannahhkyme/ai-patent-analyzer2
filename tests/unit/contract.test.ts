import { describe, expect, it } from "vitest";
import {
  CONSUMED_ENDPOINTS,
  KNOWN_SECTION_KEYS,
  UPSTREAM_CONTRACT_REF,
  UPSTREAM_REPO,
  confidenceFromCompletenessScore,
} from "@/lib/contracts/ai-patent-analyzer";

describe("confidenceFromCompletenessScore", () => {
  it.each([
    [0, "low"],
    [0.49, "low"],
    [0.5, "medium"],
    [0.84, "medium"],
    [0.85, "high"],
    [1, "high"],
  ] as const)("maps %s to %s (upstream thresholds 0.5 / 0.85)", (score, expected) => {
    expect(confidenceFromCompletenessScore(score)).toBe(expected);
  });
});

describe("shared contract", () => {
  it("pins the upstream repo and commit", () => {
    expect(UPSTREAM_REPO).toBe("hannahhkyme/ai-patent-analyzer");
    expect(UPSTREAM_CONTRACT_REF).toMatch(/^[0-9a-f]{7,40}$/);
  });

  it("lists the two endpoints the console consumes", () => {
    expect(CONSUMED_ENDPOINTS.map((e) => `${e.method} ${e.path}`)).toEqual([
      "GET /api/invention/status/[session_id]",
      "POST /api/invention/analyze",
    ]);
  });

  it("has no duplicate section keys", () => {
    expect(new Set(KNOWN_SECTION_KEYS).size).toBe(KNOWN_SECTION_KEYS.length);
  });
});
