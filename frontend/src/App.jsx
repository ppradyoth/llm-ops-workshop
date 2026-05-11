import { useEffect, useState } from "react";

import AnalysisForm from "./components/AnalysisForm.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import HealthBadge from "./components/HealthBadge.jsx";
import Logo from "./components/Logo.jsx";
import ResultPanel from "./components/ResultPanel.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { analyzeResume, getHealth } from "./lib/api.js";

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return [isDark, () => setIsDark((d) => !d)];
}

function GitHubIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Add your resume",
    desc: "Paste text directly or upload a PDF or TXT file up to 5 MB.",
  },
  {
    n: "02",
    title: "Set your target role",
    desc: "Name the role you're applying for. Optionally paste the job description for tighter gap analysis.",
  },
  {
    n: "03",
    title: "Get your analysis",
    desc: "Receive an ATS score, a list of missing keywords, resume strengths, and specific recommendations.",
  },
];

export default function App() {
  const [isDark, toggleTheme] = useTheme();
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
    setResult(null);
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-900 dark:text-slate-100">

      {/* ── Sticky nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950 anim-fade-in">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <Logo className="h-7 w-7 text-white" />
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-white">Resume Analyzer</span>
              <span className="hidden text-xs font-medium uppercase tracking-wider text-slate-500 sm:inline">
                by ppradyoth
              </span>
            </div>
          </a>

          <nav className="flex items-center gap-1 sm:gap-3">
            <a href="#how-it-works" className="nav-link hidden sm:inline">How it works</a>
            <a href="#analyzer" className="nav-link hidden sm:inline">Analyze</a>
            <div className="mx-1 hidden h-4 w-px bg-slate-700 sm:block" />
            <a
              href="https://github.com/ppradyoth/llm-ops-workshop"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="inline-flex items-center rounded-md p-2 text-slate-400 transition hover:text-white"
            >
              <GitHubIcon />
            </a>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <div className="hidden sm:block">
              <HealthBadge health={health} />
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="anim-fade-up text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">
            ATS scoring · Skill gap analysis · Role-specific recommendations
          </p>
          <h1 className="anim-fade-up anim-delay-1 mt-3 max-w-2xl text-4xl font-bold leading-tight text-slate-950 dark:text-slate-100 md:text-5xl lg:text-6xl">
            Know exactly where your resume stands.
          </h1>
          <p className="anim-fade-up anim-delay-2 mt-5 max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400">
            Paste or upload a resume, add a target role, and get a structured ATS score,
            skill gaps, and specific recommendations — not generic advice.
          </p>
          <div className="anim-fade-up anim-delay-3 mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#analyzer"
              className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Analyze your resume →
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100"
            >
              How it works
            </a>
          </div>

          {/* Tech pills */}
          <div className="anim-fade-up anim-delay-4 mt-10 flex flex-wrap gap-2">
            {["Gemini 2.5 Flash", "FastAPI", "React + Vite", "Tailwind CSS"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how-it-works" className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            How it works
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col gap-3">
                <span className="font-mono text-3xl font-bold text-slate-200 dark:text-slate-700">
                  {n}
                </span>
                <h3 className="text-base font-bold text-slate-950 dark:text-slate-100">{title}</h3>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Analyzer ───────────────────────────────────────── */}
      <section id="analyzer" className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-slate-100">Analyze a resume</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                PDF, TXT, or pasted text. Max 5 MB / 20 000 characters.
              </p>
            </div>
            <div className="sm:hidden">
              <HealthBadge health={health} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <ErrorBanner message={error} />
              <AnalysisForm onSubmit={handleAnalyze} isLoading={isLoading} />
            </div>
            <ResultPanel result={result} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">

            {/* Brand */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <Logo className="h-6 w-6 text-slate-950 dark:text-white" />
                <span className="text-sm font-bold text-slate-950 dark:text-white">Resume Analyzer</span>
              </div>
              <p className="max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-500">
                ATS scoring and career feedback powered by Gemini. Built as an open MLOps workshop project.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600">
                © {new Date().getFullYear()} ppradyoth
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 sm:grid-cols-1">
              <a
                href="https://github.com/ppradyoth/llm-ops-workshop"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link inline-flex items-center gap-1.5"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                Source code
              </a>
              <a
                href="https://github.com/ppradyoth/llm-ops-workshop/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Report an issue
              </a>
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Gemini API
              </a>
              <a href="#analyzer" className="footer-link">Back to top ↑</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
