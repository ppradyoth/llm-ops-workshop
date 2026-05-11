export default function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
      {message}
    </div>
  );
}
