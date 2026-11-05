import { ReviewConsole } from "@/components/ReviewConsole";
import { UPSTREAM_CONTRACT_REF, UPSTREAM_REPO } from "@/lib/contracts/ai-patent-analyzer";
import { REVIEW_QUEUE } from "@/lib/fixtures/disclosures";

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Patent Review Console</h1>
          <p className="subtitle">Provisional disclosure review queue</p>
        </div>
        <span className="badge-upstream" title="Upstream API contract this console mirrors">
          Contract: {UPSTREAM_REPO} @ {UPSTREAM_CONTRACT_REF}
        </span>
      </header>
      <ReviewConsole items={REVIEW_QUEUE} />
      <footer className="footer">Static fixture data. No upstream calls are made.</footer>
    </main>
  );
}
