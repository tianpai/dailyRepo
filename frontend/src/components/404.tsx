export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-8">
      <div className="text-6xl font-mono mb-4">404</div>
      <h1 className="text-2xl major-mono mb-2">Page Not Found</h1>
      <p className="text-description major-mono mb-6">How did I end up here?</p>
      <a
        href="/"
        className="major-mono text-lg text-foreground border-2 border-border px-4 py-2 hover:opacity-70 transition-opacity"
      >
        Go Home
      </a>
    </div>
  );
}
