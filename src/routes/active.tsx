import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { BigShield } from "@/components/Shield";
import { MessageCircle, Navigation, Check } from "lucide-react";

export const Route = createFileRoute("/active")({
  head: () => ({ meta: [{ title: "Escrow Active — Crowlock" }] }),
  component: Active,
});

const steps = [
  { t: "Payment Received", done: true },
  { t: "Funds Locked", done: true },
  { t: "Seller Notified", done: true },
  { t: "Preparing Shipment", done: true, current: true },
  { t: "Item Shipped", done: false },
  { t: "Delivered", done: false },
  { t: "Buyer Confirms", done: false },
  { t: "Payment Released", done: false },
];

function Active() {
  return (
    <Screen dark className="bg-secondary">
      <div className="relative overflow-hidden gradient-vault pb-8 rounded-b-[36px]">
        <TopBar title="Escrow Active" back="/home" dark transparent />
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto mt-2 h-40 w-40">
          <BigShield className="h-full w-full" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-white">Funds Securely Held</h1>
        <p className="mt-1 text-center text-[13px] text-white/60">
          $1,230.00 locked in your Crowlock vault
        </p>

        <div className="mx-5 mt-5 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10 grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50">Escrow ID</p>
            <p className="text-[13px] font-semibold text-white">CL-8241-XT</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/50">Amount</p>
            <p className="text-[13px] font-semibold text-white">$1,200.00</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50">Seller</p>
            <p className="text-[13px] font-semibold text-white">Sarah Johnson</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/50">Delivery ETA</p>
            <p className="text-[13px] font-semibold text-white">Sept 24</p>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-t-[28px] -mt-5 bg-background px-5 pb-8 pt-6 text-foreground">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-secondary">Progress Timeline</h2>
          <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.4_0.12_75)]">
            In Progress
          </span>
        </div>

        <ol className="relative mt-5 space-y-4 pl-1">
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={s.t} className="relative flex items-start gap-3 animate-float-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex flex-col items-center">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full ${
                      s.done ? "gradient-primary text-white shadow-glow" : "bg-muted text-muted-foreground"
                    } ${s.current ? "ring-4 ring-primary/20" : ""}`}
                  >
                    {s.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  {!last && (
                    <div className={`mt-1 h-9 w-0.5 rounded-full ${s.done ? "bg-primary/70" : "bg-border"}`} />
                  )}
                </div>
                <div className="pt-0.5">
                  <p className={`text-sm font-semibold ${s.done ? "text-secondary" : "text-muted-foreground"}`}>{s.t}</p>
                  {s.current && <p className="text-[11px] text-primary">Seller is preparing your item</p>}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link to="/chat" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white text-sm font-semibold text-secondary shadow-soft">
            <MessageCircle className="h-4 w-4" /> Message Seller
          </Link>
          <Link to="/transaction" className="flex h-12 items-center justify-center gap-2 rounded-2xl gradient-primary text-sm font-semibold text-white shadow-glow">
            <Navigation className="h-4 w-4" /> Track Progress
          </Link>
        </div>
      </div>
    </Screen>
  );
}
