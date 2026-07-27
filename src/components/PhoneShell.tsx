import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Repeat, MessageCircle, User, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 pt-3 pb-1 text-[13px] font-semibold",
        dark ? "text-white" : "text-secondary",
      )}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
          <rect x="0" y="6" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="5" y="4" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="10" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
          <rect x="15" y="0" width="3" height="10" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path d="M8 2c2 0 4 .7 5.5 2M8 5c1 0 2 .3 3 1M2.5 4C4 2.7 6 2 8 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          <circle cx="8" cy="8.5" r="1" fill="currentColor"/>
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
          <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" opacity="0.5"/>
          <rect x="2" y="2" width="16" height="7" rx="1.5" fill="currentColor"/>
          <rect x="21" y="4" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

export function TopBar({
  title,
  back,
  right,
  transparent = false,
  dark = false,
}: {
  title?: string;
  back?: string;
  right?: ReactNode;
  transparent?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 pt-2 pb-4",
        !transparent && "bg-background",
        dark && "text-white",
      )}
    >
      <div className="w-10">
        {back && (
          <Link
            to={back}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full",
              dark ? "bg-white/10 text-white" : "bg-muted text-secondary",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
      </div>
      <h1 className={cn("text-base font-semibold", dark ? "text-white" : "text-secondary")}>{title}</h1>
      <div className="w-10 flex justify-end">{right}</div>
    </div>
  );
}

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/transaction", label: "Transactions", icon: Repeat },
  { to: "/chat", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="sticky bottom-0 z-30 mx-auto w-full border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="grid grid-cols-4 px-2 pt-2 pb-6">
        {navItems.map((n) => {
          const active = pathname === n.to || (n.to !== "/home" && pathname.startsWith(n.to));
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-1 py-1"
            >
              <div
                className={cn(
                  "grid h-9 w-14 place-items-center rounded-full transition-all",
                  active ? "gradient-primary text-white shadow-glow" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {n.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Screen({
  children,
  className,
  dark = false,
  withNav = false,
  statusDark,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  withNav?: boolean;
  statusDark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        dark ? "text-white" : "bg-background text-foreground",
        className,
      )}
    >
      <StatusBar dark={statusDark ?? dark} />
      <div className="flex flex-1 flex-col">{children}</div>
      {withNav && <BottomNav />}
    </div>
  );
}
