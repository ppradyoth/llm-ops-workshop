import { useMemo, useState } from "react";

const SAMPLE_RESUME = `MLOps Engineer with 4 years of experience building Python and FastAPI services for machine learning workflows. Built Dockerized inference APIs, CI/CD pipelines, and monitoring dashboards that improved release reliability by 35 percent. Skilled in SQL, cloud deployment, model validation, and stakeholder communication.`;

export default function AnalysisForm({ onSubmit, isLoading }) {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [resumeFile, setResumeFile] = useState(null);
  const [targetRole, setTargetRole] = useState("MLOps Engineer");
  const [jobDescription, setJobDescription] = useState(
    "We need an engineer who can build reliable AI APIs, Docker workflows, monitoring, and CI/CD for model deployments.",
  );

  const canSubmit = useMemo(() => {
    return !isLoading && (resumeFile || resumeText.trim().length >= 80);
  }, [isLoading, resumeFile, resumeText]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ resumeText, resumeFile, targetRole, jobDescription });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Target role</span>
          <input
            className="input-control"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="Data Scientist, MLOps Engineer..."
          />
        </label>

        <label className="block">
          <span className="field-label">Upload resume</span>
          <input
            className="file-control"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
          />
        </label>
      </div>

      <label className="block">
        <span className="field-label">Resume text</span>
        <textarea
          className="textarea-control min-h-48"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste resume text here or upload a PDF/TXT file."
        />
      </label>

      <label className="block">
        <span className="field-label">Job description or role context</span>
        <textarea
          className="textarea-control min-h-28"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the job description for more targeted recommendations."
        />
      </label>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
        type="submit"
        disabled={!canSubmit}
      >
        {isLoading ? "Analyzing resume..." : "Analyze resume"}
      </button>
    </form>
  );
}

