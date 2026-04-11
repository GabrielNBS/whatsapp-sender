'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            {/* Warning shield */}
            <path d="M105 25 L175 55 L175 120 C175 160 105 195 105 195 C105 195 35 160 35 120 L35 55 Z" fill="#fef2f2" stroke="#f87171" strokeWidth="3" />
            {/* ! mark */}
            <rect x="98" y="80" width="14" height="55" rx="7" fill="#ef4444" />
            <circle cx="105" cy="155" r="8" fill="#ef4444" />
            {/* Chat bubble */}
            <ellipse cx="163" cy="48" rx="28" ry="22" fill="#22c55e" />
            <path d="M142 64 L138 78 L154 67" fill="#22c55e" />
            <text x="163" y="56" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="sans-serif">!</text>
            {/* Stars/sparks */}
            <circle cx="45" cy="55" r="4" fill="#fbbf24" />
            <circle cx="38" cy="80" r="2.5" fill="#34d399" />
            <circle cx="178" cy="130" r="3" fill="#fbbf24" />
            <circle cx="58" cy="170" r="2" fill="#f87171" />
          </svg>
        </div>

        {/* Error code label */}
        <div
          className="text-7xl font-extrabold leading-none"
          style={{ background: 'linear-gradient(135deg, #dc2626, #ca8a04)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Ops!
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">Algo deu errado</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {error.message || 'Encontramos um problema inesperado ao processar sua solicitação.'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 font-mono mt-1">Código: {error.digest}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar Novamente
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-green-700 border-2 border-green-500 transition-colors hover:bg-green-50"
          >
            Ir para o Início
          </Link>
        </div>

      </div>
    </div>
  );
}
