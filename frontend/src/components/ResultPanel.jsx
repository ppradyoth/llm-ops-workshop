function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="#0f766e"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-950">{score}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">ATS</span>
      </div>
    </div>
  );
}

function ListBlock({ title, items, tone }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : "border-sky-200 bg-sky-50 text-sky-950";

  return (
    <section className={`rounded-md border p-4 ${toneClass}`}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{title}</h3>
      <ul className="space-y-2 text-sm leading-6">
        {items.length ? (
          items.map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>No major gaps detected.</li>
        )}
      </ul>
    </section>
  );
}

export default function ResultPanel({ result }) {
  if (!result) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Submit a resume to see ATS scoring, missing skills, strengths, and recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <ScoreRing score={result.ats_score} />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Resume readiness
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {result.ats_score >= 80
                ? "Strong ATS alignment"
                : result.ats_score >= 60
                  ? "Good foundation with clear gaps"
                  : "Needs focused optimization"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              The score weighs keyword coverage, measurable impact, role alignment, and ATS-friendly structure.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ListBlock title="Missing skills" items={result.missing_skills} tone="warning" />
        <ListBlock title="Strengths" items={result.strengths} tone="success" />
        <ListBlock title="Recommendations" items={result.recommendations} tone="info" />
      </div>
    </div>
  );
}

