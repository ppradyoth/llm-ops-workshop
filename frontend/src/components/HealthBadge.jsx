export default function HealthBadge({ health }) {
  const isReady = health?.status === "ok";

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${isReady ? "bg-emerald-500" : "bg-amber-500"}`}
        aria-hidden="true"
      />
      <span>{isReady ? "Backend online" : "Checking backend"}</span>
      {health && (
        <span className="text-slate-400">
          {health.gemini_configured ? "Gemini enabled" : "Local fallback"}
        </span>
      )}
    </div>
  );
}

