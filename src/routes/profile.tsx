import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { BadgeCheck, Bell, HelpCircle, LogOut, ShieldCheck, ChevronRight, Settings, Star } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Crowlock" }] }),
  component: Profile,
});

const stats = [
  { l: "Completed", v: "42", tone: "text-[oklch(0.5_0.17_155)]" },
  { l: "Pending", v: "3", tone: "text-[oklch(0.55_0.15_75)]" },
  { l: "Disputes", v: "1", tone: "text-destructive" },
];

const settings = [
  { i: Bell, l: "Notifications", h: "Push, email, SMS" },
  { i: ShieldCheck, l: "Security", h: "PIN, biometrics, 2FA" },
  { i: Settings, l: "Preferences", h: "Language, theme" },
  { i: HelpCircle, l: "Support", h: "Help center & chat" },
];

function Profile() {
  return (
    <Screen withNav>
      <div className="relative overflow-hidden gradient-vault px-5 pb-16 pt-2 text-white rounded-b-[36px]">
        <TopBar title="Profile" back="/home" dark transparent />
        <div className="pointer-events-none absolute -right-16 top-4 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="flex flex-col items-center pt-3">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white/15 text-2xl font-bold ring-4 ring-white/10">
              T
            </div>
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-success text-white shadow-glow">
              <BadgeCheck className="h-4 w-4" strokeWidth={3} />
            </span>
          </div>
          <p className="mt-3 text-lg font-bold">Tony Okafor</p>
          <p className="text-[12px] text-white/60">tony@crowlock.io · Verified</p>

          <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-[12px] font-semibold">Trust Score</span>
            <span className="text-[12px] font-bold">4.9 · Elite</span>
          </div>
        </div>
      </div>

      <div className="-mt-10 px-5">
        <div className="grid grid-cols-3 gap-3 rounded-3xl bg-card p-4 shadow-card">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <p className={`text-2xl font-bold ${s.tone}`}>{s.v}</p>
              <p className="text-[11px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-secondary">Verification</h3>
          <div className="mt-2 space-y-2">
            {[
              { l: "Email address", done: true },
              { l: "Phone number", done: true },
              { l: "Government ID (BVN)", done: true },
              { l: "Address proof", done: false },
            ].map((v) => (
              <div key={v.l} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
                <span className="text-[13px] font-medium text-secondary">{v.l}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.done ? "bg-success/15 text-[oklch(0.5_0.17_155)]" : "bg-warning/20 text-[oklch(0.4_0.12_75)]"}`}>
                  {v.done ? "Verified" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-secondary">Settings</h3>
          <div className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
            {settings.map((s) => (
              <button key={s.l} className="flex w-full items-center gap-3 p-3.5 text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <s.i className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-secondary">{s.l}</p>
                  <p className="text-[11px] text-muted-foreground">{s.h}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <Link
          to="/welcome"
          className="mt-5 mb-6 flex h-13 items-center justify-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/5 py-3.5 text-sm font-semibold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Log out
        </Link>
      </div>
    </Screen>
  );
}
