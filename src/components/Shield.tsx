import { cn } from "@/lib/utils";

export function BigShield({ className, locked = true, animate = true }: { className?: string; locked?: boolean; animate?: boolean }) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn("absolute inset-0 rounded-full blur-3xl opacity-60 gradient-primary", animate && "animate-pulse")} />
      <svg viewBox="0 0 200 220" className={cn("relative w-full h-full", animate && "animate-shield-pulse")} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bs-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CFF" />
            <stop offset="60%" stopColor="#5B2AEB" />
            <stop offset="100%" stopColor="#0B1F4D" />
          </linearGradient>
          <linearGradient id="bs-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M100 10 L180 40 V110 C180 156 145 194 100 210 C55 194 20 156 20 110 V40 Z"
          fill="url(#bs-fill)"
        />
        <path
          d="M100 10 L180 40 V110 C180 156 145 194 100 210 Z"
          fill="url(#bs-shine)"
          opacity="0.55"
        />
        {/* Lock */}
        <g className={animate ? "animate-lock-click" : ""}>
          <rect x="72" y="98" width="56" height="52" rx="10" fill="#fff" />
          <path
            d="M80 98 V82 C80 71 89 62 100 62 C111 62 120 71 120 82 V98"
            stroke="#fff"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {locked ? (
            <>
              <circle cx="100" cy="120" r="6" fill="#5B2AEB" />
              <rect x="97" y="122" width="6" height="14" rx="2" fill="#5B2AEB" />
            </>
          ) : (
            <path d="M88 118 L98 128 L114 108" stroke="#22C55E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          )}
        </g>
      </svg>
    </div>
  );
}
