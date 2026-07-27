import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { BigShield } from "@/components/Shield";
import { CreditCard, Landmark, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/payment")({
  head: () => ({ meta: [{ title: "Fund Escrow — Crowlock" }] }),
  component: Payment,
});

function Payment() {
  const [method, setMethod] = useState<"card" | "bank">("card");

  return (
    <Screen>
      <TopBar title="Fund Escrow" back="/review" />
      <div className="flex-1 px-5 pb-8">
        {/* Shield */}
        <div className="relative mx-auto mt-2 mb-4 h-36 w-36">
          <BigShield className="h-full w-full" />
        </div>
        <p className="text-center text-[12px] leading-snug text-muted-foreground">
          Your money will remain securely protected until <br /> delivery has been confirmed.
        </p>

        {/* Amount card */}
        <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-muted-foreground">Escrow Amount</span>
            <span className="text-[14px] font-semibold text-secondary">$1,200.00</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-muted-foreground">Escrow + Delivery Fee</span>
            <span className="text-[14px] font-semibold text-secondary">$30.00</span>
          </div>
          <div className="my-2 border-t border-dashed border-border" />
          <div className="flex items-end justify-between pt-1">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">$1,230.00</span>
          </div>
        </div>

        {/* Payment methods */}
        <h3 className="mt-5 text-sm font-semibold text-secondary">Payment Method</h3>
        <div className="mt-2 space-y-2.5">
          {[
            { id: "card", icon: CreditCard, title: "Debit Card", sub: "Visa •••• 4821", tag: "Instant" },
            { id: "bank", icon: Landmark, title: "Bank Transfer", sub: "Access Bank · 0123456789", tag: "1–5 min" },
          ].map((m) => {
            const active = method === (m.id as any);
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as any)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  active ? "border-primary bg-primary-soft/50 shadow-soft" : "border-border bg-card"
                }`}
              >
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${active ? "gradient-primary text-white" : "bg-muted text-secondary"}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-secondary">{m.title}</p>
                  <p className="text-[11px] text-muted-foreground">{m.sub}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {m.tag}
                </span>
                <div className={`ml-1 grid h-5 w-5 place-items-center rounded-full border-2 ${active ? "border-primary bg-primary text-white" : "border-border"}`}>
                  {active && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <Link
          to="/active"
          className="mt-6 flex h-14 items-center justify-center rounded-2xl gradient-primary text-[15px] font-semibold text-white shadow-glow active:scale-[0.98]"
        >
          Pay into Escrow · $1,230.00
        </Link>
      </div>
    </Screen>
  );
}
