import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ReviewConsole } from "@/components/ReviewConsole";
import { REVIEW_QUEUE } from "@/lib/fixtures/disclosures";

function rows() {
  return within(screen.getByRole("region", { name: "Review queue" })).getAllByRole("row").slice(1);
}

function detail() {
  return screen.getByRole("complementary", { name: "Disclosure detail" });
}

describe("ReviewConsole", () => {
  it("renders one row per disclosure", () => {
    render(<ReviewConsole items={REVIEW_QUEUE} />);
    expect(rows()).toHaveLength(REVIEW_QUEUE.length);
  });

  it("shows status counts that match the queue", () => {
    render(<ReviewConsole items={REVIEW_QUEUE} />);
    const summary = screen.getByRole("region", { name: "Queue summary" });
    const expected = {
      "Needs info": REVIEW_QUEUE.filter((d) => d.status === "needs_info").length,
      "In review": REVIEW_QUEUE.filter((d) => d.status === "in_review").length,
      "Ready to file": REVIEW_QUEUE.filter((d) => d.status === "ready_to_file").length,
      "On hold": REVIEW_QUEUE.filter((d) => d.status === "on_hold").length,
    };
    for (const [label, count] of Object.entries(expected)) {
      const card = within(summary).getByText(label).closest(".summary-card") as HTMLElement;
      expect(within(card).getByText(String(count))).toBeInTheDocument();
    }
  });

  it("selects the first disclosure by default", () => {
    render(<ReviewConsole items={REVIEW_QUEUE} />);
    const first = REVIEW_QUEUE[0];
    expect(rows()[0]).toHaveAttribute("aria-selected", "true");
    expect(within(detail()).getByRole("heading", { level: 2 })).toHaveTextContent(first.title);
  });

  it("updates the detail panel when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<ReviewConsole items={REVIEW_QUEUE} />);
    const target = REVIEW_QUEUE[2];
    await user.click(rows()[2]);
    expect(rows()[2]).toHaveAttribute("aria-selected", "true");
    expect(rows()[0]).toHaveAttribute("aria-selected", "false");
    const panel = detail();
    expect(within(panel).getByRole("heading", { level: 2 })).toHaveTextContent(target.title);
    expect(within(panel).getByText(target.sessionId)).toBeInTheDocument();
    expect(within(panel).getByText(target.notes[0].body)).toBeInTheDocument();
  });

  it("supports keyboard selection with Enter and Space", async () => {
    const user = userEvent.setup();
    render(<ReviewConsole items={REVIEW_QUEUE} />);
    rows()[1].focus();
    await user.keyboard("{Enter}");
    expect(rows()[1]).toHaveAttribute("aria-selected", "true");
    rows()[3].focus();
    await user.keyboard(" ");
    expect(rows()[3]).toHaveAttribute("aria-selected", "true");
    expect(within(detail()).getByRole("heading", { level: 2 })).toHaveTextContent(REVIEW_QUEUE[3].title);
  });

  it("lists missing sections, or says none are missing", async () => {
    const user = userEvent.setup();
    render(<ReviewConsole items={REVIEW_QUEUE} />);
    for (const [i, d] of REVIEW_QUEUE.entries()) {
      await user.click(rows()[i]);
      const panel = detail();
      if (d.upstream.sections_missing.length === 0) {
        expect(within(panel).getByText("None. All tracked sections are complete.")).toBeInTheDocument();
      } else {
        expect(within(panel).queryByText("None. All tracked sections are complete.")).not.toBeInTheDocument();
        expect(panel.querySelectorAll(".chip-missing")).toHaveLength(d.upstream.sections_missing.length);
      }
      expect(within(panel).getByText(d.upstream.ready_to_file ? "Yes" : "No")).toBeInTheDocument();
    }
  });

  it("shows completeness as a rounded percentage", () => {
    render(<ReviewConsole items={REVIEW_QUEUE} />);
    const pct = Math.round(REVIEW_QUEUE[0].upstream.completeness_score * 100);
    expect(within(rows()[0]).getByLabelText(`Completeness ${pct}%`)).toHaveTextContent(`${pct}%`);
  });

  it("renders an empty queue without a detail panel", () => {
    render(<ReviewConsole items={[]} />);
    expect(rows()).toHaveLength(0);
    expect(screen.queryByRole("complementary", { name: "Disclosure detail" })).not.toBeInTheDocument();
  });
});
