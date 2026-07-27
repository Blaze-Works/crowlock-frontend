import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BigShield } from "@/components/Shield";
import { StatusBar } from "@/components/PhoneShell";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/welcome" }), 2600);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden gradient-vault text-white">
      <StatusBar dark />
      {/* ambient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <BigShield className="h-52 w-52" />
        <h1 className="mt-8 text-4xl font-bold tracking-tight animate-float-up">
          Crowlock
        </h1>
        <p className="mt-3 text-base text-white/70 animate-float-up [animation-delay:150ms]">
          Trade With Confidence
        </p>
      </div>

      <div className="pb-14 flex flex-col items-center gap-3">
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white/90"
            style={{ width: "60%", animation: "shimmer 1.6s linear infinite", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.4), #fff, rgba(255,255,255,0.4))", backgroundSize: "200% 100%" }}
          />
        </div>
        <span className="text-xs uppercase tracking-[0.3em] text-white/50">Securing your vault</span>
      </div>
    </div>
  );
}
