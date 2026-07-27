import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/PhoneShell";
import { useState } from "react";
import { Camera, ChevronDown, Calendar, MapPin, Check } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Create Escrow — Crowlock" }] }),
  component: CreateEscrow,
});

function Field({ label, placeholder, value, icon, hint, multiline }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-secondary">{label}</span>
      <div className="relative">
        {multiline ? (
          <textarea
            defaultValue={value}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        ) : (
          <input
            defaultValue={value}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-border bg-white px-4 py-3.5 text-sm text-secondary placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        )}
        {icon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </label>
  );
}

function CreateEscrow() {
  const [agreed, setAgreed] = useState(true);
  return (
    <Screen>
      <TopBar title="Create New Escrow" back="/home" />
      <div className="flex-1 space-y-4 px-5 pb-8">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${s === 1 ? "gradient-primary text-white shadow-glow" : "bg-muted text-muted-foreground"}`}>{s}</div>
              {i < 2 && <div className={`h-1 flex-1 rounded-full ${s < 1 ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <p className="text-[12px] text-muted-foreground">Step 1 of 3 · Transaction details</p>

        <Field label="Buyer Name" placeholder="Tony Okafor" value="Tony Okafor" />
        <Field label="Seller Name" placeholder="@sarahj" value="Sarah Johnson" />
        <Field label="Product Name" placeholder="e.g. iPhone 15 Pro Max" />
        <Field label="Product Description" placeholder="Condition, storage, color, warranty…" multiline />

        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-secondary">Transaction Amount</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-secondary">$</span>
            <input
              placeholder="0.00"
              inputMode="decimal"
              defaultValue="1,200.00"
              className="w-full rounded-2xl border border-border bg-white pl-9 pr-4 py-3.5 text-lg font-bold text-secondary placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Delivery Method" value="Courier" icon={<ChevronDown className="h-4 w-4" />} />
          <Field label="Delivery Date" value="Sept 24, 2025" icon={<Calendar className="h-4 w-4" />} />
        </div>

        <Field label="Delivery Address" value="14 Adeola Odeku, Lagos" icon={<MapPin className="h-4 w-4" />} />

        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-secondary">Upload Product Images</span>
          <div className="flex gap-3 overflow-x-auto">
            <button className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/50 text-primary">
              <Camera className="h-6 w-6" />
            </button>
            {["from-violet-400 to-fuchsia-500", "from-sky-400 to-indigo-500", "from-amber-400 to-rose-500"].map((g) => (
              <div key={g} className={`h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br ${g} shadow-card`} />
            ))}
          </div>
        </div>

        <button
          onClick={() => setAgreed((v) => !v)}
          className="flex w-full items-start gap-3 rounded-2xl bg-primary-soft/60 p-3 text-left"
        >
          <div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${agreed ? "gradient-primary border-transparent text-white" : "border-border bg-white"}`}>
            {agreed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </div>
          <p className="text-[12px] leading-relaxed text-secondary">
            I agree to Crowlock's <span className="font-semibold text-primary">Terms of Service</span> and confirm both parties consent to this escrow.
          </p>
        </button>

        <Link
          to="/review"
          className="mt-2 flex h-14 items-center justify-center rounded-2xl gradient-primary text-[15px] font-semibold text-white shadow-glow active:scale-[0.98]"
        >
          Continue
        </Link>
      </div>
    </Screen>
  );
}
