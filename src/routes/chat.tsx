import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { Camera, Paperclip, Send, ShieldCheck, Truck, Check, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Secure Chat — Crowlock" }] }),
  component: Chat,
});

const messages = [
  { from: "them", text: "Hi Tony! Escrow received, thanks. Packing your iPhone now 📦", time: "9:12" },
  { from: "me", text: "Awesome — please include the original box and both cables 🙏", time: "9:14", read: true },
  { from: "them", text: "Of course. Sending you a photo before shipping.", time: "9:15" },
  { from: "them", type: "image", time: "9:22" },
  { from: "me", text: "Perfect. Please ship today if possible.", time: "9:24", read: true },
  { from: "them", text: "Done ✅ Courier just picked it up. Tracking coming soon.", time: "10:02" },
];

function Chat() {
  return (
    <Screen withNav>
      <TopBar
        title="Sarah Johnson"
        back="/home"
        right={
          <div className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-[oklch(0.5_0.17_155)]">
            <ShieldCheck className="h-4 w-4" />
          </div>
        }
      />

      {/* Pinned transaction card */}
      <div className="mx-4 mb-3 rounded-2xl border border-border bg-primary-soft/60 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-[13px] font-semibold text-secondary">iPhone 15 Pro Max</p>
              <span className="rounded-full bg-warning/25 px-1.5 py-0.5 text-[9px] font-semibold text-[oklch(0.4_0.12_75)]">
                In Escrow
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">CL-8241 · $1,200.00 · Awaiting shipment</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 border-t border-dashed border-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Today</span>
          <div className="flex-1 border-t border-dashed border-border" />
        </div>

        {messages.map((m, i) => {
          const mine = m.from === "me";
          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"} animate-float-up`} style={{ animationDelay: `${i * 40}ms` }}>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] ${mine ? "gradient-primary text-white rounded-br-md" : "bg-muted text-secondary rounded-bl-md"}`}>
                {m.type === "image" ? (
                  <div className="h-32 w-40 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900" />
                ) : (
                  <p className="leading-snug">{m.text}</p>
                )}
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                  {m.time}
                  {mine && (m.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing */}
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "120ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "240ms" }} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        <button className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-success/15 px-3 py-1.5 text-[11px] font-semibold text-[oklch(0.45_0.17_155)]">
          <Truck className="h-3.5 w-3.5" /> Confirm Shipment
        </button>
        <button className="flex items-center gap-1.5 whitespace-nowrap rounded-full gradient-primary px-3 py-1.5 text-[11px] font-semibold text-white">
          <Check className="h-3.5 w-3.5" /> Confirm Delivery
        </button>
        <button className="whitespace-nowrap rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
          Share Update
        </button>
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-border bg-background px-3 py-2.5">
        <button className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          placeholder="Type a secure message…"
          className="flex-1 rounded-full bg-muted px-4 py-2.5 text-[13px] placeholder:text-muted-foreground focus:outline-none"
        />
        <button className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <Camera className="h-4 w-4" />
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-white shadow-glow">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </Screen>
  );
}
