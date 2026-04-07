import { FormEvent, useState } from 'react';
import { isAxiosError } from 'axios';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/firebase';
import { registerUser, validateLoginStatus } from '../lib/api';

type Mode = 'login' | 'register';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 28 28" fill="none" aria-hidden>
    <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="url(#auth-lg)" strokeWidth="1.5"/>
    <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" fill="url(#auth-lg)" opacity="0.2"/>
    <circle cx="14" cy="14" r="2.5" fill="url(#auth-lg)"/>
    <defs>
      <linearGradient id="auth-lg" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f7b871"/>
        <stop offset="1" stopColor="#d4a574"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<'architect' | 'lojista'>('architect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getApiErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError<{ error?: string; message?: string }>(err)) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      if (msg) return msg;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const handleLogin = async () => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const statusResponse = await validateLoginStatus(email);
      if (!statusResponse.success) {
        await signOut(auth);
        setError(statusResponse.error || 'Falha ao validar status do usuário.');
        return;
      }
      setSuccess('Login realizado com sucesso!');
      onLoginSuccess();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Não foi possível realizar o login.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const response = await registerUser({ name, email, password, role });
      if (!response.success) {
        setError(response.error || 'Não foi possível registrar usuário.');
        return;
      }
      setSuccess(response.message || 'Conta criada! Aguarde aprovação do administrador.');
      setMode('login');
      setPassword('');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erro ao registrar usuário.'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'login') await handleLogin();
    else await handleRegister();
  };

  const switchMode = (m: Mode) => { setMode(m); setError(null); setSuccess(null); };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Brand Panel (hidden on mobile) ──────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center p-12 bg-gradient-to-br from-[#071519] via-[#0d2d33] to-[#152d32] overflow-hidden">
        {/* ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[hsl(var(--sidebar-accent)/0.07)] blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-teal-500/6 blur-2xl pointer-events-none" />
        {/* dot pattern */}
        <div className="dot-pattern absolute inset-0 opacity-20 pointer-events-none" />

        <div className="relative max-w-sm text-center">
          {/* Logo mark */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Logo />
            <span className="text-3xl font-extrabold text-gradient-gold tracking-tight">SpecPoints</span>
          </div>

          {/* Tagline */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug mb-4">
            O programa de fidelidade<br />
            <span className="text-gradient-gold">para arquitetos de alto padrão.</span>
          </h2>
          <p className="text-white/45 text-sm leading-relaxed">
            Cada projeto especificado vira pontos reais. Troque por prêmios exclusivos e experiências únicas.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              { icon: '◆', label: 'Pontos em cada especificação de produto' },
              { icon: '◆', label: 'Prêmios exclusivos e viagens internacionais' },
              { icon: '◆', label: 'Painel de controle em tempo real' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                <span className="text-[hsl(var(--sidebar-accent))] text-xs">{f.icon}</span>
                <p className="text-white/65 text-sm">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/30 border border-white/8 px-4 py-2 rounded-full bg-white/4 backdrop-blur-sm">
            <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live" />
            Sistema ativo
          </span>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-[#f0f4f5] via-[#e8eff1] to-[#dde8ea]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Logo />
            <span className="text-2xl font-extrabold text-gradient-gold">SpecPoints</span>
          </div>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 shadow-[0_32px_80px_rgba(7,24,27,0.14),0_8px_24px_rgba(7,24,27,0.07)] p-7 sm:p-9">

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === 'login'
                  ? 'Acesse seu painel SpecPoints'
                  : 'Registre-se e aguarde aprovação'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1.5 mb-7 p-1 bg-muted/60 rounded-xl border border-border/30">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={[
                    'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
                    mode === m
                      ? 'bg-white shadow-sm text-foreground border border-border/40'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {m === 'login' ? 'Entrar' : 'Cadastro'}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === 'register' && (
                <fieldset className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 rounded-xl border border-border/60 bg-white/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all duration-200"
                  />
                </fieldset>
              )}

              <fieldset className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="voce@empresa.com"
                  className="w-full px-4 py-3 rounded-xl border border-border/60 bg-white/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all duration-200"
                />
              </fieldset>

              <fieldset className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-border/60 bg-white/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </fieldset>

              {mode === 'register' && (
                <fieldset className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Perfil
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'architect' | 'lojista')}
                    className="w-full px-4 py-3 rounded-xl border border-border/60 bg-white/80 backdrop-blur-sm text-sm text-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all duration-200"
                  >
                    <option value="architect">Arquiteto</option>
                    <option value="lojista">Lojista</option>
                  </select>
                </fieldset>
              )}

              {/* Feedback messages */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200/70 text-red-700 text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-sm animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-shimmer relative w-full overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[hsl(var(--primary)/0.82)] text-primary-foreground font-bold py-3.5 rounded-xl shadow-btn-primary hover:shadow-btn-hover hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none border-t border-white/15 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : mode === 'login' ? (
                  'Entrar na plataforma'
                ) : (
                  'Criar conta'
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[11px] text-muted-foreground/60">
            Ao continuar, você concorda com os termos de uso da plataforma SpecPoints.
          </p>
        </div>
      </div>
    </div>
  );
}
