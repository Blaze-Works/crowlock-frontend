import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/PhoneShell";
import {
  Bell,
  Plus,
  Wallet,
  MessageSquare,
  BadgeCheck,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home — Crowlock" }],
  }),
  component: HomePage,
});

const quickActions = [
  { icon: Plus, label: "Create Escrow", to: "/create", tint: "gradient-primary text-white" },
  { icon: Wallet, label: "My Transactions", to: "/transaction", tint: "bg-primary-soft text-primary" },
  { icon: MessageSquare, label: "Messages", to: "/chat", tint: "bg-primary-soft text-primary" },
  { icon: BadgeCheck, label: "Verification", to: "/profile", tint: "bg-primary-soft text-primary" },
];

const recent = [
  { id: "CL-8241", label: "iPhone 15 Pro Max", amount: 1200, status: "Pending", who: "with @sarahj" },
  { id: "CL-8235", label: "MacBook Air M3", amount: 1550, status: "Completed", who: "with @dev.mo" },
  { id: "CL-8221", label: "Nike Jordan 1 Chicago", amount: 340, status: "Disputed", who: "with @kicksplug" },
  { id: "CL-8214", label: "PS5 Slim + 2 Games", amount: 480, status: "Completed", who: "with @gameroom" },
];

const statusStyle: Record<string, string> = {
  Pending: "bg-warning/15 text-warning-foreground",
  Completed: "bg-success/15 text-[oklch(0.45_0.15_155)]",
  Disputed: "bg-destructive/10 text-destructive",
};

const statusIcon: Record<string, typeof Clock> = {
  Pending: Clock,
  Completed: CheckCircle2,
  Disputed: AlertOctagon,
};

function HomePage() {
  const [hidden, setHidden] = useState(false);
  const [filter, setFilter] = useState<"All" | "Pending" | "Completed" | "Disputed">("All");
  const filtered = recent.filter((r) => filter === "All" || r.status === filter);

  return (
    <Screen withNav>
      {/* Gradient hero */}
      <div className="relative overflow-hidden gradient-vault px-5 pb-8 pt-2 text-white rounded-b-[32px]">
        <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-lg font-bold">
              T
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/60">Good Morning</p>
              <p className="text-[15px] font-semibold">Tony Okafor</p>
            </div>
          </div>
          <button className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F59E0B]" />
          </button>
        </div>

        <div className="mt-6 rounded-3xl bg-white/10 p-5 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/60">Funds in Escrow</span>
            <button onClick={() => setHidden((v) => !v)} className="text-white/70">
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[32px] font-bold tracking-tight">
              {hidden ? "••••••" : "$2,890.00"}
            </p>
            <div className="flex items-center gap-1 rounded-full bg-success/25 px-2 py-1 text-[11px] font-semibold text-white">
              <ArrowUpRight className="h-3 w-3" /> Secured
            </div>
          </div>
          <p className="mt-1 text-[12px] text-white/60">Across 3 active transactions</p>
        </div>
      </div>

      <div className="-mt-4 px-5">
        {/* Quick Actions */}
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <Link key={a.label} to={a.to} className="flex flex-col items-center gap-2 text-center">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${a.tint}`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="text-[10.5px] font-medium leading-tight text-secondary">
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-secondary">Recent Transactions</h2>
          <Link to="/transaction" className="text-xs font-medium text-primary">See all</Link>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(["All", "Pending", "Completed", "Disputed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition ${
                filter === s
                  ? "gradient-primary text-white shadow-soft"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2.5 pb-6">
          {filtered.map((r, i) => {
            const Icon = statusIcon[r.status];
            return (
              <Link
                to="/transaction"
                key={r.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card animate-float-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-secondary">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground">{r.id} • {r.who}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-secondary">${r.amount}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[r.status]}`}>
                    <Icon className="h-3 w-3" /> {r.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}1
