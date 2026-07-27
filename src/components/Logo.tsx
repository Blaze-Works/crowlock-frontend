import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ShieldMark className="h-8 w-8" />
      {showWord && (
        <span className="text-[1.35rem] font-bold tracking-tight text-secondary">
          Crow<span className="text-primary">lock</span>
        </span>
      )}
    </div>
  );
}

export function ShieldMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cl-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B5CFF" />
          <stop offset="100%" stopColor="#4B1FD6" />
        </linearGradient>
      </defs>
      <path
        d="M20 3 L34 8 V20 C34 28 27.5 34.5 20 37 C12.5 34.5 6 28 6 20 V8 Z"
        fill="url(#cl-shield)"
      />
      <rect x="15" y="18" width="10" height="9" rx="2" fill="#fff" />
      <path d="M16.5 18 V15.5 C16.5 13.5 18 12 20 12 C22 12 23.5 13.5 23.5 15.5 V18" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="22" r="1.4" fill="#4B1FD6" />
    </svg>
  );
}
