'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0f1e' }}>
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold tracking-widest mb-3" style={{ color: '#c9a84c' }}>ERROR</p>
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>
          Something went wrong
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          An unexpected error occurred. Please try again, and contact us if the problem continues.
        </p>
        <button
          onClick={reset}
          className="inline-block px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ background: '#c9a84c', color: '#0a0f1e' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
