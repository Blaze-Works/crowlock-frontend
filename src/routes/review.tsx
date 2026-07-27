import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { Pencil, ShieldCheck, User2, Store, Package } from "lucide-react";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review Transaction — Crowlock" }] }),
  component: Review,
});

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-white/70">{label}</span>
      <span className={strong ? "text-lg font-bold text-white" : "text-[13px] font-semibold text-white"}>{value}</span>
    </div>
  );
}

function Review() {
  return (
    <Screen>
      <TopBar title="Review Transaction" back="/create" />
      <div className="flex-1 px-5 pb-8">
        <p className="text-[12px] text-muted-foreground">Please confirm the details before funding the escrow.</p>

        {/* Big summary card */}
        <div className="relative mt-4 overflow-hidden rounded-3xl gradient-vault p-5 text-white shadow-glow">
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-white/60">Escrow Summary</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">CL-8241</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold">iPhone 15 Pro Max</p>
              <p className="text-[11px] text-white/60">256GB · Natural Titanium</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/60">
                <User2 className="h-3 w-3" /> Buyer
              </div>
              <p className="mt-1 text-[13px] font-semibold">Tony Okafor</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/60">
                <Store className="h-3 w-3" /> Seller
              </div>
              <p className="mt-1 text-[13px] font-semibold">Sarah Johnson</p>
            </div>
          </div>

          <div className="mt-4 border-t border-white/15 pt-2">
            <Row label="Item Amount" value="$1,200.00" />
            <Row label="Escrow Fee (1.5%)" value="$18.00" />
            <Row label="Delivery Fee" value="$12.00" />
            <div className="mt-1 border-t border-white/15" />
            <Row label="Total" value="$1,230.00" strong />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 p-3">
          <ShieldCheck className="h-5 w-5 text-[oklch(0.5_0.17_155)]" />
          <p className="text-[12px] leading-snug text-secondary">
            Funds are held in a secure escrow vault. Neither party can withdraw until delivery is confirmed.
          </p>
        </div>

        <div className="mt-auto grid grid-cols-5 gap-3 pt-6">
          <Link
            to="/create"
            className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-white text-sm font-semibold text-secondary shadow-soft active:scale-[0.98]"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <Link
            to="/payment"
            className="col-span-3 flex h-14 items-center justify-center rounded-2xl gradient-primary text-sm font-semibold text-white shadow-glow active:scale-[0.98]"
          >
            Proceed to Payment
          </Link>
        </div>
      </div>
    </Screen>
  );
}
