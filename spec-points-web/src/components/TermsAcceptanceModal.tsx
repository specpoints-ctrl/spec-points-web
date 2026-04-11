import { useState } from 'react';
import { Loader2, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { acceptTerms, Terms } from '../lib/api';

interface TermsAcceptanceModalProps {
  terms: Terms;
  onAccepted: () => void;
}

export default function TermsAcceptanceModal({ terms, onAccepted }: TermsAcceptanceModalProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!checked) return;
    setLoading(true); setError(null);
    try {
      const res = await acceptTerms(terms.id);
      if (res.success) {
        onAccepted();
      } else {
        setError(res.error || 'Erro ao registrar aceite.');
      }
    } catch {
      setError('Não foi possível registrar o aceite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,21,25,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#0d1e24,#112830)', border: '1px solid rgba(196,181,160,0.15)' }}>

        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(196,181,160,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(196,181,160,0.12)' }}>
              <FileText className="w-5 h-5" style={{ color: '#c4b5a0' }} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Termos e Condições</h2>
              <p className="text-xs" style={{ color: 'rgba(196,181,160,0.6)' }}>
                Versão {terms.version} — Leia antes de continuar
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className="rounded-xl p-4 overflow-y-auto text-sm leading-relaxed mb-5"
            style={{
              maxHeight: '260px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(196,181,160,0.1)',
              color: 'rgba(255,255,255,0.7)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {terms.content}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-5 select-none">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: checked ? '#c4b5a0' : 'rgba(196,181,160,0.3)',
                  background: checked ? '#c4b5a0' : 'transparent',
                }}
              >
                {checked && <CheckCircle2 className="w-3 h-3 text-[#071519]" />}
              </div>
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Li e aceito os <strong style={{ color: '#c4b5a0' }}>Termos e Condições</strong> da plataforma CONNECTUS.
            </span>
          </label>

          {/* Button */}
          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: checked && !loading
                ? 'linear-gradient(135deg,#c4b5a0 0%,#a89680 100%)'
                : 'rgba(196,181,160,0.15)',
              color: checked && !loading ? '#071519' : 'rgba(196,181,160,0.5)',
            }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</> : 'Continuar para a plataforma'}
          </button>
        </div>
      </div>
    </div>
  );
}
