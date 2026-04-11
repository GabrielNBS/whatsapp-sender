'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-xl">
      <div className="max-w-sm w-full text-center space-y-5">

        {/* Compact Illustration */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-32 h-32"
          >
            {/* Warning triangle */}
            <path d="M80 20 L148 140 H12 Z" fill="#fef2f2" stroke="#f87171" strokeWidth="3" strokeLinejoin="round" />
            {/* ! mark */}
            <rect x="74" y="70" width="12" height="40" rx="6" fill="#ef4444" />
            <circle cx="80" cy="122" r="7" fill="#ef4444" />
            {/* Sparkle */}
            <circle cx="20" cy="40" r="4" fill="#fbbf24" />
            <circle cx="145" cy="55" r="3" fill="#34d399" />
            {/* Small chat badge */}
            <ellipse cx="135" cy="35" rx="20" ry="16" fill="#22c55e" />
            <path d="M118 47 L115 57 L127 50" fill="#22c55e" />
            <text x="135" y="41" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="sans-serif">!</text>
          </svg>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-800">Erro no Painel</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Não foi possível carregar esta seção do dashboard.
          </p>
        </div>

        {/* Technical detail */}
        {(error.message || error.digest) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
            <p className="text-xs font-mono text-gray-400 break-all">
              {error.message}
              {error.digest && <span className="block mt-0.5">Digest: {error.digest}</span>}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar Novamente
          </button>
        </div>

      </div>
    </div>
  );
}
