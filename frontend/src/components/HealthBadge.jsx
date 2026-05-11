export default function HealthBadge({ health }) {
  const isReady = health?.status === "ok";

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
      <span
        className={`h-2 w-2 rounded-full ${isReady ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
        aria-hidden="true"
      />
      <span>{isReady ? "Backend online" : "Connecting…"}</span>
      {health && (
        <span className="text-slate-500">·</span>
      )}
      {health && (
        <span className={health.gemini_configured ? "text-violet-400" : "text-slate-500"}>
          {health.gemini_configured ? "Gemini" : "Fallback"}
        </span>
      )}
    </div>
  );
}
