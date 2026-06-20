import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0f1e' }}>
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold tracking-widest mb-3" style={{ color: '#c9a84c' }}>404</p>
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>
          Page not found
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ background: '#c9a84c', color: '#0a0f1e' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
