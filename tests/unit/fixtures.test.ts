import { describe, expect, it } from "vitest";
import { KNOWN_SECTION_KEYS, confidenceFromCompletenessScore } from "@/lib/contracts/ai-patent-analyzer";
import { REVIEW_QUEUE } from "@/lib/fixtures/disclosures";

const known = new Set<string>(KNOWN_SECTION_KEYS);

describe("review queue fixtures", () => {
  it("is non-empty with unique disclosure and session ids", () => {
    expect(REVIEW_QUEUE.length).toBeGreaterThan(0);
    expect(new Set(REVIEW_QUEUE.map((d) => d.id)).size).toBe(REVIEW_QUEUE.length);
    expect(new Set(REVIEW_QUEUE.map((d) => d.sessionId)).size).toBe(REVIEW_QUEUE.length);
  });

  it.each(REVIEW_QUEUE.map((d) => [d.id, d] as const))("%s is consistent with the upstream contract", (_id, d) => {
    expect(d.id).toMatch(/^PRV-\d{4}$/);
    expect(Number.isNaN(Date.parse(d.lastUpdated))).toBe(false);

    const { completeness_score, confidence, sections_complete, sections_missing, ready_to_file } = d.upstream;
    expect(completeness_score).toBeGreaterThanOrEqual(0);
    expect(completeness_score).toBeLessThanOrEqual(1);
    expect(confidence).toBe(confidenceFromCompletenessScore(completeness_score));

    for (const key of [...sections_complete, ...sections_missing]) expect(known.has(key), key).toBe(true);
    expect(sections_complete.filter((s) => sections_missing.includes(s))).toEqual([]);

    expect(ready_to_file).toBe(d.status === "ready_to_file");
    if (ready_to_file) expect(sections_missing).toEqual([]);
  });

  it.each(REVIEW_QUEUE.map((d) => [d.id, d] as const))("%s has review notes newest first", (_id, d) => {
    expect(d.notes.length).toBeGreaterThan(0);
    const times = d.notes.map((n) => Date.parse(n.at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});
