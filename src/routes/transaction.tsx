import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { ShieldCheck, Download, AlertOctagon, Check } from "lucide-react";

export const Route = createFileRoute("/transaction")({
  head: () => ({ meta: [{ title: "Transaction Details — Crowlock" }] }),
  component: TransactionPage,
});

const timeline = [
  { t: "Payment Completed", d: "Sept 20 · 9:41 AM", done: true },
  { t: "Seller Accepted", d: "Sept 20 · 10:02 AM", done: true },
  { t: "Item Shipped", d: "Sept 21 · 4:20 PM", done: true },
  { t: "Delivered", d: "Awaiting confirmation", done: false, current: true },
];

function TransactionPage() {
  return (
    <Screen withNav>
      <TopBar title="Transaction Details" back="/home" />
      <div className="flex-1 px-5 pb-6">
        {/* Progress arc */}
        <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" stroke="var(--muted)" strokeWidth="10" fill="none" />
            <circle
              cx="60" cy="60" r="52"
              stroke="url(#tx-grad)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - 0.72)}
            />
            <defs>
              <linearGradient id="tx-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8B5CFF" />
                <stop offset="100%" stopColor="#4B1FD6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full gradient-primary text-white shadow-glow">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
              <p className="text-[13px] font-bold text-secondary">Payment Protected</p>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-2 rounded-3xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Escrow #</p>
              <p className="text-sm font-bold text-secondary">CL-8241-XT</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount</p>
              <p className="text-lg font-bold text-primary">$1,230.00</p>
            </div>
          </div>
          <div className="my-3 border-t border-dashed border-border" />
          <ol className="space-y-3">
            {timeline.map((s, i) => (
              <li key={s.t} className="flex items-start gap-3">
                <div className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full ${s.done ? "gradient-primary text-white" : "bg-muted text-muted-foreground"} ${s.current ? "ring-4 ring-primary/15" : ""}`}>
                  {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-[13px] font-semibold ${s.done ? "text-secondary" : "text-muted-foreground"}`}>{s.t}</p>
                  <p className="text-[11px] text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="col-span-2 flex h-14 items-center justify-center rounded-2xl gradient-primary text-sm font-semibold text-white shadow-glow active:scale-[0.98]">
            <Check className="mr-2 h-4 w-4" /> Release Payment
          </button>
          <Link to="/dispute" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 text-sm font-semibold text-destructive">
            <AlertOctagon className="h-4 w-4" /> Raise Dispute
          </Link>
          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white text-sm font-semibold text-secondary shadow-soft">
            <Download className="h-4 w-4" /> Download Receipt
          </button>
        </div>
      </div>
    </Screen>
  );
}
