import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { useState } from "react";
import { Image, Video, FileText, MessageSquare, AlertOctagon, Check, Upload } from "lucide-react";

export const Route = createFileRoute("/dispute")({
  head: () => ({ meta: [{ title: "Dispute Center — Crowlock" }] }),
  component: Dispute,
});

const reasons = [
  "Item not received",
  "Item damaged or defective",
  "Item different from description",
  "Counterfeit or fake product",
  "Seller unresponsive",
  "Other",
];

function Dispute() {
  const [selected, setSelected] = useState("Item not received");

  return (
    <Screen>
      <TopBar title="Dispute Center" back="/transaction" />
      <div className="flex-1 px-5 pb-8">
        <div className="flex items-start gap-3 rounded-2xl bg-destructive/8 border border-destructive/20 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
            <AlertOctagon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-destructive">Under Crowlock Review</p>
            <p className="text-[11px] text-muted-foreground">Our team responds within 24 hours. Funds stay safely locked during review.</p>
          </div>
        </div>

        <h3 className="mt-5 text-sm font-semibold text-secondary">Select a reason</h3>
        <div className="mt-2 space-y-2">
          {reasons.map((r) => {
            const active = selected === r;
            return (
              <button
                key={r}
                onClick={() => setSelected(r)}
                className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left text-[13px] transition ${
                  active ? "border-primary bg-primary-soft/60 text-secondary" : "border-border bg-card text-secondary"
                }`}
              >
                <span className="font-medium">{r}</span>
                <div className={`grid h-5 w-5 place-items-center rounded-full border-2 ${active ? "border-primary bg-primary text-white" : "border-border"}`}>
                  {active && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <h3 className="mt-5 text-sm font-semibold text-secondary">Upload evidence</h3>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[
            { i: Image, l: "Photos" },
            { i: Video, l: "Videos" },
            { i: FileText, l: "Docs" },
            { i: MessageSquare, l: "Chat" },
          ].map(({ i: Icon, l }) => (
            <button key={l} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-muted/40 text-primary">
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold text-secondary">{l}</span>
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          placeholder="Describe what happened in detail…"
          className="mt-4 w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />

        <Link
          to="/transaction"
          className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl gradient-primary text-sm font-semibold text-white shadow-glow"
        >
          <Upload className="h-4 w-4" /> Submit Dispute
        </Link>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          By submitting, you agree Crowlock may review chat history and transaction details.
        </p>
      </div>
    </Screen>
  );
}
