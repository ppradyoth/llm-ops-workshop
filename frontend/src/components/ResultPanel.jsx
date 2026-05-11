function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label =
    score >= 80 ? "Strong alignment" : score >= 60 ? "Good foundation" : "Needs work";

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ring-track)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={strokeColor}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-950 dark:text-slate-100">{score}</span>
        <span className="mt-0.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}

function MissingIcon() {
  return (
    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function StrengthIcon() {
  return (
    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="5,8.5 7,10.5 11,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecommendIcon() {
  return (
    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="8,5 11,8 8,11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SECTION_CONFIG = {
  missing:   { label: "Missing skills",  toneLight: "border-amber-200 bg-amber-50 text-amber-950",     toneDark: "dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100",   Icon: MissingIcon },
  strengths: { label: "Strengths",       toneLight: "border-emerald-200 bg-emerald-50 text-emerald-950", toneDark: "dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-100", Icon: StrengthIcon },
  recs:      { label: "Recommendations", toneLight: "border-sky-200 bg-sky-50 text-sky-950",             toneDark: "dark:border-sky-800/50 dark:bg-sky-950/20 dark:text-sky-100",       Icon: RecommendIcon },
};

function ListBlock({ type, items }) {
  const { label, toneLight, toneDark, Icon } = SECTION_CONFIG[type];
  return (
    <section className={`rounded-lg border p-4 ${toneLight} ${toneDark}`}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest opacity-60">{label}</h3>
      <ul className="space-y-2.5 text-sm leading-6">
        {items.length ? (
          items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Icon />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="flex items-start gap-2 opacity-50">
            <Icon />
            <span>No major gaps detected.</span>
          </li>
        )}
      </ul>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-5">
          <div className="h-32 w-32 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-56 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2.5">
              <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-3/5 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const EMPTY_FEATURES = [
  {
    Icon: MissingIcon,
    title: "ATS Score",
    desc: "A 0–100 score based on keyword coverage, role alignment, quantified impact, and ATS-friendly structure.",
  },
  {
    Icon: StrengthIcon,
    title: "Skill Gaps & Strengths",
    desc: "Exact keywords missing for your target role, plus what the resume already does well.",
  },
  {
    Icon: RecommendIcon,
    title: "Recommendations",
    desc: "Prioritised, specific actions — not generic advice about \"tailoring your resume.\"",
  },
];

function EmptyState() {
  return (
    <div className="space-y-4">
      <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
        Submit a resume to see your analysis
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {EMPTY_FEATURES.map(({ Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-slate-100 bg-white p-4 opacity-50 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex h-6 w-6 items-center justify-center">
              <Icon />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultPanel({ result, isLoading }) {
  if (isLoading) return <LoadingSkeleton />;
  if (!result) return <EmptyState />;

  const engineLabel = result.engine === "gemini" ? "Gemini AI" : "Local fallback";
  const engineClass =
    result.engine === "gemini"
      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
      : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400";

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <ScoreRing score={result.ats_score} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">
                Resume readiness
              </p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${engineClass}`}>
                {engineLabel}
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-100">
              {result.ats_score >= 80
                ? "Strong ATS alignment"
                : result.ats_score >= 60
                  ? "Good foundation, clear gaps"
                  : "Needs focused optimisation"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Score reflects keyword match, measurable impact, role alignment, and document structure.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ListBlock type="missing"   items={result.missing_skills} />
        <ListBlock type="strengths" items={result.strengths} />
        <ListBlock type="recs"      items={result.recommendations} />
      </div>
    </div>
  );
}
