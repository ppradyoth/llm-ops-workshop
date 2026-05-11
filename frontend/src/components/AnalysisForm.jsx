import { useMemo, useState } from "react";

const SAMPLE_RESUME = `MLOps Engineer with 4 years of experience building Python and FastAPI services for machine learning workflows. Built Dockerized inference APIs, CI/CD pipelines, and monitoring dashboards that improved release reliability by 35 percent. Skilled in SQL, cloud deployment, model validation, and stakeholder communication.`;

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function AnalysisForm({ onSubmit, isLoading }) {
  const [inputMode, setInputMode] = useState("text");
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [resumeFile, setResumeFile] = useState(null);
  const [targetRole, setTargetRole] = useState("MLOps Engineer");
  const [jobDescription, setJobDescription] = useState(
    "We need an engineer who can build reliable AI APIs, Docker workflows, monitoring, and CI/CD for model deployments.",
  );

  const canSubmit = useMemo(() => {
    if (isLoading) return false;
    if (inputMode === "file") return resumeFile !== null;
    return resumeText.trim().length >= 80;
  }, [isLoading, inputMode, resumeFile, resumeText]);

  function handleModeChange(mode) {
    setInputMode(mode);
    if (mode === "text") setResumeFile(null);
    if (mode === "file") setResumeText("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      resumeText: inputMode === "text" ? resumeText : "",
      resumeFile: inputMode === "file" ? resumeFile : null,
      targetRole,
      jobDescription,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="field-label">Target role</span>
        <input
          className="input-control"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Data Scientist, MLOps Engineer, Backend Engineer"
        />
      </label>

      <div>
        <span className="field-label">Resume input</span>
        <div className="mb-3 flex w-fit rounded-md border border-slate-200 p-0.5 dark:border-slate-600">
          {["text", "file"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                inputMode === mode
                  ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {mode === "text" ? "Paste text" : "Upload PDF / TXT"}
            </button>
          ))}
        </div>

        {inputMode === "text" ? (
          <textarea
            className="textarea-control min-h-44"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here (minimum 80 characters)."
          />
        ) : (
          <div className="flex min-h-44 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center dark:border-slate-600 dark:bg-slate-700/40">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {resumeFile ? resumeFile.name : "No file selected"}
              </p>
              <label className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                {resumeFile ? "Change file" : "Choose file"}
                <input
                  className="sr-only"
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </label>
              {!resumeFile && (
                <p className="text-xs text-slate-400 dark:text-slate-500">PDF or TXT, up to 5 MB</p>
              )}
            </div>
          </div>
        )}
      </div>

      <label className="block">
        <span className="field-label">
          Job description{" "}
          <span className="font-normal text-slate-400 dark:text-slate-500">(optional — improves targeting)</span>
        </span>
        <textarea
          className="textarea-control min-h-24"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description for role-specific gap analysis."
        />
      </label>

      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-600 md:w-auto"
        type="submit"
        disabled={!canSubmit}
      >
        {isLoading ? (
          <>
            <Spinner />
            Analyzing…
          </>
        ) : (
          "Analyze resume"
        )}
      </button>
    </form>
  );
}
