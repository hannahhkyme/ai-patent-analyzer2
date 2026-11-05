"use client";

import { useState } from "react";
import type { DisclosureReview, ReviewStatus } from "@/lib/fixtures/disclosures";

const STATUS_LABEL: Record<ReviewStatus, string> = {
  needs_info: "Needs info",
  in_review: "In review",
  ready_to_file: "Ready to file",
  on_hold: "On hold",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

function humanize(key: string): string {
  const text = key.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Completeness({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="meter" aria-label={`Completeness ${pct}%`}>
      <div className="meter-track">
        <div className="meter-fill" data-level={score >= 0.85 ? "high" : score >= 0.5 ? "medium" : "low"} style={{ width: `${pct}%` }} />
      </div>
      <span className="meter-value">{pct}%</span>
    </div>
  );
}

export function ReviewConsole({ items }: { items: readonly DisclosureReview[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  const counts = items.reduce<Record<ReviewStatus, number>>(
    (acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }),
    { needs_info: 0, in_review: 0, ready_to_file: 0, on_hold: 0 },
  );

  return (
    <>
      <section className="summary" aria-label="Queue summary">
        {(Object.keys(STATUS_LABEL) as ReviewStatus[]).map((s) => (
          <div key={s} className="summary-card">
            <span className={`status status-${s}`}>{STATUS_LABEL[s]}</span>
            <strong>{counts[s]}</strong>
          </div>
        ))}
      </section>

      <div className="layout">
        <section className="panel queue" aria-label="Review queue">
          <table>
            <thead>
              <tr>
                <th>Disclosure</th>
                <th>Inventor</th>
                <th>Status</th>
                <th>Completeness</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={item.id === selected?.id ? "selected" : undefined}
                  onClick={() => setSelectedId(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(item.id);
                    }
                  }}
                  tabIndex={0}
                  aria-selected={item.id === selected?.id}
                >
                  <td>
                    <div className="title">{item.title}</div>
                    <div className="muted mono">{item.id}</div>
                  </td>
                  <td className="nowrap">{item.inventor}</td>
                  <td>
                    <span className={`status status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                  </td>
                  <td>
                    <Completeness score={item.upstream.completeness_score} />
                  </td>
                  <td className="muted nowrap">{formatDate(item.lastUpdated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {selected && (
          <aside className="panel detail" aria-label="Disclosure detail">
            <div className="detail-head">
              <span className="muted mono">{selected.id}</span>
              <span className={`status status-${selected.status}`}>{STATUS_LABEL[selected.status]}</span>
            </div>
            <h2>{selected.title}</h2>
            <dl className="facts">
              <dt>Inventor</dt>
              <dd>{selected.inventor}</dd>
              <dt>Session</dt>
              <dd className="mono">{selected.sessionId}</dd>
              <dt>Confidence</dt>
              <dd>{humanize(selected.upstream.confidence)}</dd>
              <dt>Ready to file</dt>
              <dd>{selected.upstream.ready_to_file ? "Yes" : "No"}</dd>
            </dl>
            <Completeness score={selected.upstream.completeness_score} />

            <h3>Missing sections</h3>
            {selected.upstream.sections_missing.length === 0 ? (
              <p className="muted">None. All tracked sections are complete.</p>
            ) : (
              <ul className="chips">
                {selected.upstream.sections_missing.map((s) => (
                  <li key={s} className="chip chip-missing">{humanize(s)}</li>
                ))}
              </ul>
            )}

            <h3>Complete sections</h3>
            <ul className="chips">
              {selected.upstream.sections_complete.map((s) => (
                <li key={s} className="chip chip-done">{humanize(s)}</li>
              ))}
            </ul>

            <h3>Review notes</h3>
            <ol className="notes">
              {selected.notes.map((note) => (
                <li key={`${note.at}-${note.author}`}>
                  <div className="note-meta">
                    <strong>{note.author}</strong>
                    <span className="muted">{formatDate(note.at)}</span>
                  </div>
                  <p>{note.body}</p>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </>
  );
}
