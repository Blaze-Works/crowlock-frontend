import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/PhoneShell";
import { BigShield } from "@/components/Shield";
import { Logo } from "@/components/Logo";
import { ShieldCheck, Users, Lock } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — Crowlock" },
      { name: "description", content: "Secure every transaction with Crowlock escrow." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <StatusBar />
      <div className="relative flex flex-1 flex-col items-center px-6 pb-8 pt-4">
        <div className="w-full flex justify-center">
          <Logo />
        </div>

        <div className="relative mt-8 w-full">
          <div className="absolute inset-0 -z-0 mx-auto h-64 w-64 translate-x-1/2 rounded-full bg-primary/10 blur-3xl" style={{ left: "-25%" }} />
          <div className="mx-auto flex justify-center">
            <BigShield className="h-56 w-56" />
          </div>
        </div>

        <div className="mt-6 text-center animate-float-up">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-secondary">
            Secure Every<br />Transaction.
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
            Crowlock protects buyers and sellers by securely holding funds until both parties fulfill their agreement.
          </p>
        </div>

        <div className="mt-7 grid w-full grid-cols-3 gap-2">
          {[
            { i: ShieldCheck, t: "Escrow" },
            { i: Users, t: "P2P Safe" },
            { i: Lock, t: "Encrypted" },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted/60 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-white">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-secondary">{t}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto w-full space-y-3 pt-8">
          <Link
            to="/home"
            className="flex h-14 w-full items-center justify-center rounded-2xl gradient-primary text-[15px] font-semibold text-white shadow-glow transition-transform active:scale-[0.98]"
          >
            Create Account
          </Link>
          <Link
            to="/home"
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-border bg-white text-[15px] font-semibold text-secondary shadow-soft transition-transform active:scale-[0.98]"
          >
            Login
          </Link>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
