import {
  confidenceFromCompletenessScore,
  type SectionKey,
  type StatusResult,
} from "@/lib/contracts/ai-patent-analyzer";

export type ReviewStatus = "needs_info" | "in_review" | "ready_to_file" | "on_hold";

export type ReviewNote = {
  author: string;
  at: string;
  body: string;
};

export type DisclosureReview = {
  id: string;
  sessionId: string;
  title: string;
  inventor: string;
  status: ReviewStatus;
  lastUpdated: string;
  /** Shaped like the upstream GET /api/invention/status/[session_id] response. */
  upstream: StatusResult & {
    sections_complete: SectionKey[];
    sections_missing: SectionKey[];
  };
  notes: ReviewNote[];
};

function status(
  completeness_score: number,
  sections_complete: SectionKey[],
  sections_missing: SectionKey[],
  ready_to_file = false,
): DisclosureReview["upstream"] {
  return {
    completeness_score,
    confidence: confidenceFromCompletenessScore(completeness_score),
    sections_complete,
    sections_missing,
    ready_to_file,
  };
}

export const REVIEW_QUEUE: readonly DisclosureReview[] = [
  {
    id: "PRV-1037",
    sessionId: "c09d77b215",
    title: "Low-power gesture ring for AR headsets",
    inventor: "Priya Raman",
    status: "needs_info",
    lastUpdated: "2026-11-04T15:12:00Z",
    upstream: status(
      0.44,
      ["title", "initial_description"],
      ["specification_detail", "novelty_and_differences", "drawings_or_figures"],
    ),
    notes: [
      { author: "A. Chen", at: "2026-11-04T15:12:00Z", body: "Description is under 120 characters. Asked inventor for how the sensor fusion works." },
      { author: "Analyzer", at: "2026-11-03T09:30:00Z", body: "High overlap risk with existing IMU-based wearables; differentiation needed." },
    ],
  },
  {
    id: "PRV-1042",
    sessionId: "a3f9c1d2e7",
    title: "Self-balancing cargo bike hitch",
    inventor: "Maya Okafor",
    status: "ready_to_file",
    lastUpdated: "2026-11-03T16:20:00Z",
    upstream: status(
      0.88,
      ["title", "initial_description", "problem_statement", "differentiation", "disclosure_timeline"],
      [],
      true,
    ),
    notes: [
      { author: "J. Park", at: "2026-11-03T16:20:00Z", body: "All sections present. Figures 1–4 attached. Cleared for provisional filing." },
      { author: "Analyzer", at: "2026-11-02T10:05:00Z", body: "Two similar patents surfaced; inventor's differentiation addresses both." },
    ],
  },
  {
    id: "PRV-1039",
    sessionId: "b81e40aa93",
    title: "Moisture-aware drip irrigation valve",
    inventor: "Luis Fernández",
    status: "in_review",
    lastUpdated: "2026-11-02T21:47:00Z",
    upstream: status(
      0.72,
      ["title", "initial_description", "problem_statement", "differentiation"],
      ["disclosure_timeline"],
    ),
    notes: [
      { author: "J. Park", at: "2026-11-02T21:47:00Z", body: "Strong novelty section. Need to confirm whether the farm co-op demo in August was under NDA." },
    ],
  },
  {
    id: "PRV-1033",
    sessionId: "d4420fe8c6",
    title: "Compostable cold-chain shipping liner",
    inventor: "Hannah Lindqvist",
    status: "in_review",
    lastUpdated: "2026-10-30T18:03:00Z",
    upstream: status(
      0.64,
      ["title", "initial_description", "problem_statement"],
      ["novelty_and_differences", "first_use_date_or_public_disclosure"],
    ),
    notes: [
      { author: "A. Chen", at: "2026-10-30T18:03:00Z", body: "Materials list is thorough. Missing comparison to existing mycelium liners." },
    ],
  },
  {
    id: "PRV-1028",
    sessionId: "e7b3a19c40",
    title: "Kitchen scale with recipe-scaling display",
    inventor: "Omar Haddad",
    status: "on_hold",
    lastUpdated: "2026-10-27T11:40:00Z",
    upstream: status(
      0.32,
      ["title", "initial_description"],
      ["specification_detail", "novelty_and_differences", "how_it_works", "what_makes_it_new"],
    ),
    notes: [
      { author: "J. Park", at: "2026-10-27T11:40:00Z", body: "Inventor paused: product was shown at a trade show. Checking the one-year grace period before continuing." },
    ],
  },
  {
    id: "PRV-1021",
    sessionId: "f15c8e02bd",
    title: "Pediatric dose-check syringe collar",
    inventor: "Grace Mensah",
    status: "needs_info",
    lastUpdated: "2026-10-24T08:55:00Z",
    upstream: status(
      0.52,
      ["title", "initial_description", "problem_statement"],
      ["drawings_or_figures", "disclosure_timeline"],
    ),
    notes: [
      { author: "A. Chen", at: "2026-10-24T08:55:00Z", body: "Requested labeled sketches of the collar locking mechanism." },
    ],
  },
] as const;
