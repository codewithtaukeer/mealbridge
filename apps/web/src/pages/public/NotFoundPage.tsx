import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-obsidian-shell">
      <div className="text-center">
        <h1 className="text-8xl font-display font-medium text-neon-pulse/20 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-display font-medium text-pure-white mb-2">
          Page not found
        </h2>
        <p className="text-slate-text mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-neon-pulse text-obsidian-shell font-medium rounded-pill hover:bg-neon-pulse/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
