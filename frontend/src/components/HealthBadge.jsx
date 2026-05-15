const OFFLINE_MESSAGES = [
  "Backend went for chai",
  "Backend is napping",
  "Backend ghosted us",
  "Backend took a day off",
  "Backend said not today",
];

const offlineMessage = OFFLINE_MESSAGES[Math.floor(Math.random() * OFFLINE_MESSAGES.length)];

export default function HealthBadge({ health }) {
  const isReady = health?.status === "ok";
  const isOffline = health?.status === "offline";

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
      <span
        className={`h-2 w-2 rounded-full ${isReady ? "bg-emerald-400" : isOffline ? "bg-red-400" : "bg-amber-400 animate-pulse"}`}
        aria-hidden="true"
      />
      <span>{isReady ? "Backend online" : isOffline ? offlineMessage : "Connecting…"}</span>
      {isReady && (
        <span className="text-slate-500">·</span>
      )}
      {isReady && (
        <span className={health.gemini_configured ? "text-violet-400" : "text-slate-500"}>
          {health.gemini_configured ? "Gemini" : "Fallback"}
        </span>
      )}
      {health?.version && (
        <>
          <span className="text-slate-500">·</span>
          <span className="text-slate-500">v{health.version}</span>
        </>
      )}
    </div>
  );
}
