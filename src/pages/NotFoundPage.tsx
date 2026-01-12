import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-6">
          <span
            className="text-8xl font-bold text-primary/20"
            aria-hidden="true"
          >
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="mb-2 text-2xl font-bold text-text">Page Not Found</h1>
        <p className="mb-8 max-w-md text-text-muted">
          The page you are looking for does not exist or has been moved.
          This might happen if you are offline and the content has not been downloaded yet.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-medium text-text transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go Back
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
