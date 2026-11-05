/**
 * Shared contract: the subset of the upstream AI Patent Analyzer API
 * (hannahhkyme/ai-patent-analyzer) that this console expects.
 *
 * Mirrors, by hand:
 *   - upstream lib/api-reference.ts  (API_ENDPOINTS)
 *   - upstream lib/invention/types.ts (StatusResult, AnalyzeResult, ...)
 * as of upstream commit 86203a2 (2026-09-16).
 *
 * This console does not call the API yet; it renders local fixtures shaped
 * like these types. If the upstream contract changes, update this file and
 * the fixtures together.
 */

export const UPSTREAM_REPO = "hannahhkyme/ai-patent-analyzer";
export const UPSTREAM_CONTRACT_REF = "86203a2";

export type DisclosureConfidence = "low" | "medium" | "high";

/** GET /api/invention/status/[session_id] */
export type StatusResult = {
  completeness_score: number;
  confidence: DisclosureConfidence;
  sections_complete: string[];
  sections_missing: string[];
  ready_to_file: boolean;
};

export type SimilarPatentRef = {
  title: string;
  id?: string;
  snippet?: string;
};

/** POST /api/invention/analyze */
export type AnalyzeResult = {
  completeness_score: number;
  confidence: DisclosureConfidence;
  missing_sections: string[];
  risk_assessment: string;
  recommendations: string[];
  similar_patents: SimilarPatentRef[];
  uspto_search_query?: string;
};

export type ConsumedEndpoint = {
  readonly method: "GET" | "POST";
  readonly path: string;
  readonly responseType: "StatusResult" | "AnalyzeResult";
  /** Response fields the console reads; must be a subset of the upstream responseFields. */
  readonly fieldsUsed: readonly string[];
};

/** Upstream endpoints the console depends on. */
export const CONSUMED_ENDPOINTS: readonly ConsumedEndpoint[] = [
  {
    method: "GET",
    path: "/api/invention/status/[session_id]",
    responseType: "StatusResult",
    fieldsUsed: ["completeness_score", "sections_complete", "sections_missing", "ready_to_file"],
  },
  {
    method: "POST",
    path: "/api/invention/analyze",
    responseType: "AnalyzeResult",
    fieldsUsed: ["completeness_score", "missing_sections", "risk_assessment", "recommendations"],
  },
] as const;

/** Section keys the upstream service emits in sections_complete / sections_missing / missing_sections. */
export const KNOWN_SECTION_KEYS = [
  "title",
  "initial_description",
  "problem_statement",
  "differentiation",
  "disclosure_timeline",
  "specification_detail",
  "novelty_and_differences",
  "how_it_works",
  "what_makes_it_new",
  "drawings_or_figures",
  "first_use_date_or_public_disclosure",
] as const;

export type SectionKey = (typeof KNOWN_SECTION_KEYS)[number];

/** Upstream rule (lib/invention/completeness.ts): >= 0.85 high, >= 0.5 medium, else low. */
export function confidenceFromCompletenessScore(score: number): DisclosureConfidence {
  if (score >= 0.85) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}
