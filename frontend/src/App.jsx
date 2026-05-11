import { useEffect, useState } from "react";

import AnalysisForm from "./components/AnalysisForm.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import HealthBadge from "./components/HealthBadge.jsx";
import ResultPanel from "./components/ResultPanel.jsx";
import { analyzeResume, getHealth } from "./lib/api.js";

export default function App() {
  const [health, setHealth] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  async function handleAnalyze(formValues) {
    setError("");
    setIsLoading(true);
    try {
      const analysis = await analyzeResume(formValues);
      setResult(analysis);
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing the resume.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 md:flex-row md:items-end md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              AI Resume Analyzer
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
              Career assistant for ATS scoring and role-ready recommendations
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Upload a resume or paste text, add a target role, and get structured JSON-backed feedback from the API.
            </p>
          </div>
          <HealthBadge health={health} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:px-8">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Analyze a resume</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                PDF, TXT, or pasted text are supported.
              </p>
            </div>
          </div>
          <ErrorBanner message={error} />
          <div className="mt-5">
            <AnalysisForm onSubmit={handleAnalyze} isLoading={isLoading} />
          </div>
        </div>

        <ResultPanel result={result} />
      </section>
    </main>
  );
}

