import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-warm-ivory">
      <div className="text-center">
        <h1 className="text-8xl font-display font-bold text-bridge-green/20 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-display font-semibold text-forest-night mb-2">
          Page not found
        </h2>
        <p className="text-muted-text mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-bridge-green text-white font-medium rounded-button hover:bg-forest-night transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
