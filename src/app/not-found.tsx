import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Illustration */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 220 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-52 h-52"
          >
            {/* Phone body */}
            <rect x="60" y="30" width="90" height="155" rx="16" fill="#f0fdf4" stroke="#22c55e" strokeWidth="3" />
            {/* Screen */}
            <rect x="70" y="50" width="70" height="110" rx="8" fill="#dcfce7" />
            {/* Crack lines */}
            <path d="M100 70 L115 95 L105 95 L122 125" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M90 80 L83 100" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
            {/* Home button */}
            <circle cx="105" cy="170" r="7" fill="#bbf7d0" stroke="#22c55e" strokeWidth="2" />
            {/* Chat bubble with ? */}
            <ellipse cx="158" cy="55" rx="32" ry="28" fill="#22c55e" />
            <path d="M135 75 L130 90 L148 78" fill="#22c55e" />
            <text x="158" y="63" textAnchor="middle" fontSize="26" fontWeight="bold" fill="white" fontFamily="sans-serif">?</text>
            {/* Stars */}
            <circle cx="50" cy="60" r="4" fill="#fbbf24" />
            <circle cx="42" cy="90" r="2.5" fill="#34d399" />
            <circle cx="175" cy="130" r="3" fill="#fbbf24" />
            <circle cx="60" cy="160" r="2" fill="#f87171" />
            <circle cx="168" cy="100" r="2" fill="#a3e635" />
          </svg>
        </div>

        {/* 404 number */}
        <div
          className="text-8xl font-extrabold leading-none"
          style={{ background: 'linear-gradient(135deg, #16a34a, #ca8a04)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          404
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">Página não encontrada</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            A rota que você tentou acessar não existe ou foi movida.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir para o Início
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-green-700 border-2 border-green-500 transition-colors hover:bg-green-50"
          >
            ← Voltar
          </Link>
        </div>

      </div>
    </div>
  );
}
