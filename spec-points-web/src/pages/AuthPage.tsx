import { FormEvent, useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import {
  signInWithEmailAndPassword, signOut, signInWithPopup,
  GoogleAuthProvider, sendPasswordResetEmail,
} from 'firebase/auth';
import {
  Loader2, AlertCircle, CheckCircle2, Eye, EyeOff,
  Mail, Lock, User, Briefcase, Phone, Building2, MapPin, CreditCard,
  Calendar, ArrowLeft, ChevronRight,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { registerUser, validateLoginStatus, googleLoginUpsert } from '../lib/api';

type Mode = 'login' | 'register' | 'forgot';
type RegisterStep = 1 | 2;

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 28 28" fill="none" aria-hidden>
    <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="url(#auth-lg)" strokeWidth="1.5"/>
    <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" fill="url(#auth-lg)" opacity="0.25"/>
    <circle cx="14" cy="14" r="2.5" fill="url(#auth-lg)"/>
    <defs>
      <linearGradient id="auth-lg" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f7b871"/>
        <stop offset="1" stopColor="#d4a574"/>
      </linearGradient>
    </defs>
  </svg>
);

const Field = ({
  label, icon: Icon, children,
}: { label: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b6e78]">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#8fadb4]" strokeWidth={2} />
      {children}
    </div>
  </div>
);

const inputCls = 'w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#071519] placeholder:text-gray-300 focus:outline-none focus:border-[#0b6e78] focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,110,120,0.12)] transition-all';

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<RegisterStep>(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<'architect' | 'lojista'>('architect');

  const [name, setName] = useState('');
  const [documentCi, setDocumentCi] = useState('');
  const [ruc, setRuc] = useState('');
  const [company, setCompany] = useState('');
  const [telefone, setTelefone] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [birthday, setBirthday] = useState('');

  const [storeName, setStoreName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerCi, setOwnerCi] = useState('');
  const [storeRuc, setStoreRuc] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeOfficePhone, setStoreOfficePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [ownerBirthday, setOwnerBirthday] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

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
        setError(statusResponse.error || 'Error al validar estado del usuario.');
        return;
      }
      setSuccess('¡Inicio de sesión exitoso!');
      onLoginSuccess();
    } catch (err: unknown) {
      await signOut(auth).catch(() => {});
      setError(getApiErrorMessage(err, 'No fue posible iniciar sesión.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Correo y contraseña son obligatorios'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setStep(2);
  };

  const handleRegisterStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      const payload = role === 'architect'
        ? {
            email, password, role: 'architect' as const,
            name, document_ci: documentCi, ruc, company, telefone,
            office_phone: officePhone, address, city, birthday,
          }
        : {
            email, password, role: 'lojista' as const,
            store_name: storeName, cnpj, owner_name: ownerName, owner_ci: ownerCi,
            store_ruc: storeRuc, store_phone: storePhone, store_office_phone: storeOfficePhone,
            store_address: storeAddress, store_city: storeCity, owner_birthday: ownerBirthday,
          };

      const response = await registerUser(payload);
      if (!response.success) {
        setError(response.error || 'No fue posible registrar el usuario.');
        return;
      }
      setSuccess(response.message || '¡Cuenta creada! Espere la aprobación del administrador.');
      switchMode('login');
      setPassword('');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al registrar usuario.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { setError('Ingrese su correo'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setSuccess('¡Correo de recuperación enviado! Verifique su bandeja de entrada.');
    } catch {
      setError('No fue posible enviar el correo. Verifique si la dirección es correcta.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'login') await handleLogin();
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const displayName = result.user.displayName ?? result.user.email ?? '';
      const response = await googleLoginUpsert(displayName);
      if (!response.success) {
        await signOut(auth);
        setError(response.error || 'No fue posible acceder a la plataforma con esta cuenta Google.');
        return;
      }
      if (response.data?.status === 'pending') {
        await signOut(auth);
        setSuccess('¡Cuenta creada! Espere la aprobación del administrador para acceder.');
        return;
      }
      if (response.data?.status === 'blocked') {
        await signOut(auth);
        setError('Su cuenta está bloqueada. Contacte al soporte.');
        return;
      }
      setSuccess('¡Inicio de sesión exitoso!');
      onLoginSuccess();
    } catch (err: unknown) {
      await signOut(auth).catch(() => {});
      setError(getApiErrorMessage(err, 'No fue posible iniciar sesión con Google.'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m); setStep(1);
    setError(null); setSuccess(null);
  };

  const Feedback = () => (
    <>
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}
    </>
  );

  const SubmitBtn = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,110,120,0.35)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-2"
      style={{ background: 'linear-gradient(135deg,#0b6e78 0%,#134e56 100%)' }}
    >
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── PANEL DE MARCA IZQUIERDO ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[48%] relative flex-col items-center justify-center p-14 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #071519 0%, #0b2228 45%, #0f2d35 75%, #071c22 100%)' }}
      >
        <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full animate-blob"
          style={{ background: 'radial-gradient(circle at 40% 40%, rgba(19,136,143,0.38) 0%, transparent 65%)' }} />
        <div className="absolute top-[20%] -right-32 w-[400px] h-[400px] rounded-full animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(212,165,116,0.28) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 left-[10%] w-[440px] h-[440px] rounded-full animate-blob animation-delay-4000"
          style={{ background: 'radial-gradient(circle at 50% 60%, rgba(10,84,96,0.35) 0%, transparent 65%)' }} />
        <div className="dot-pattern absolute inset-0 opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-[360px] w-full text-center">
          <div className="flex flex-col items-center gap-5 mb-12">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-[2rem] font-extrabold tracking-tight" style={{ background: 'linear-gradient(90deg,#f7b871,#d4a574)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CONNECTUS
              </span>
            </div>
            <img src="/moducasa-logo.png" alt="Grupo Moducasa" className="h-9 w-auto object-contain"
              style={{ filter: 'invert(1) brightness(0.88)' }} />
          </div>
          <h2 className="text-[1.75rem] font-extrabold text-white leading-tight mb-4">
            El programa de fidelidad para{' '}
            <span style={{ background: 'linear-gradient(90deg,#f7b871,#d4a574)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              arquitectos de alto nivel.
            </span>
          </h2>
          <p className="text-white/40 text-[0.9rem] leading-relaxed mb-12">
            Cada proyecto especificado se convierte en puntos reales.<br />
            Canjéalos por premios exclusivos y experiencias únicas.
          </p>
          <div className="flex flex-col gap-3 text-left">
            {['Puntos en cada especificación de producto', 'Premios exclusivos y viajes internacionales', 'Panel de control en tiempo real'].map((label, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-[#d4a574] text-[10px]">◆</span>
                <span className="text-white/60 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-7 left-0 right-0 flex justify-center">
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30 px-5 py-2 rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live" />
            Sistema activo
          </span>
        </div>
      </div>

      {/* ── PANEL DE FORMULARIO DERECHO ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 sm:px-16 overflow-y-auto">
        <div className="w-full max-w-[440px] animate-fade-in-up">

          {/* Logo móvil */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-2xl font-extrabold" style={{ background: 'linear-gradient(90deg,#f7b871,#d4a574)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CONNECTUS
              </span>
            </div>
            <img src="/moducasa-logo.png" alt="Grupo Moducasa" className="h-7 w-auto" style={{ filter: 'brightness(0)' }} />
          </div>

          {/* ── RECUPERAR CONTRASEÑA ─────────────────────────────────── */}
          {mode === 'forgot' && (
            <>
              <button type="button" onClick={() => switchMode('login')}
                className="flex items-center gap-1.5 text-sm text-[#0b6e78] mb-6 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
              </button>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-[#071519]">Recuperar contraseña</h1>
                <p className="text-[#7a9099] text-sm mt-1.5">Enviaremos un enlace de restablecimiento a su correo.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <Field label="Correo electrónico" icon={Mail}>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    required placeholder="usted@empresa.com" className={inputCls} />
                </Field>
                <Feedback />
                <SubmitBtn label="Enviar enlace de recuperación" />
              </form>
            </>
          )}

          {/* ── INICIO DE SESIÓN ─────────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <div className="mb-8">
                <h1 className="text-[1.85rem] font-extrabold text-[#071519] leading-tight tracking-tight">Bienvenido de vuelta.</h1>
                <p className="text-[#7a9099] text-sm mt-1.5">Acceda a su panel CONNECTUS</p>
              </div>

              <div className="flex gap-6 mb-8 border-b border-gray-100">
                {(['login', 'register'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => switchMode(m)}
                    className={['pb-3 text-sm font-bold transition-all duration-200 border-b-2 -mb-[1px]',
                      mode === m ? 'border-[#0b6e78] text-[#071519]' : 'border-transparent text-[#a0b4ba] hover:text-[#071519]'].join(' ')}>
                    {m === 'login' ? 'Ingresar' : 'Crear cuenta'}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <Field label="Correo electrónico" icon={Mail}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usted@empresa.com" className={inputCls} />
                </Field>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b6e78]">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#8fadb4]" strokeWidth={2} />
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      required minLength={8} placeholder="Mínimo 8 caracteres"
                      className="w-full h-11 pl-11 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#071519] placeholder:text-gray-300 focus:outline-none focus:border-[#0b6e78] focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,110,120,0.12)] transition-all" />
                    <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fadb4] hover:text-[#071519] transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => switchMode('forgot')}
                      className="text-xs text-[#0b6e78] hover:underline mt-1">
                      ¿Olvidó su contraseña?
                    </button>
                  </div>
                </div>

                <Feedback />
                <SubmitBtn label="Ingresar a la plataforma" />
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-300 uppercase tracking-widest">o</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button type="button" onClick={handleGoogleLogin} disabled={loading}
                className="w-full h-12 rounded-xl border border-gray-200 bg-white text-[#071519] text-sm font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continuar con Google
              </button>
            </>
          )}

          {/* ── REGISTRO PASO 1 ──────────────────────────────────────── */}
          {mode === 'register' && step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-[1.85rem] font-extrabold text-[#071519] leading-tight tracking-tight">Crea tu cuenta.</h1>
                <p className="text-[#7a9099] text-sm mt-1.5">Paso 1 de 2 — Datos de acceso</p>
              </div>

              <div className="flex gap-6 mb-8 border-b border-gray-100">
                {(['login', 'register'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => switchMode(m)}
                    className={['pb-3 text-sm font-bold transition-all duration-200 border-b-2 -mb-[1px]',
                      mode === m ? 'border-[#0b6e78] text-[#071519]' : 'border-transparent text-[#a0b4ba] hover:text-[#071519]'].join(' ')}>
                    {m === 'login' ? 'Ingresar' : 'Crear cuenta'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleRegisterStep1} className="space-y-5">
                <Field label="Correo electrónico" icon={Mail}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usted@empresa.com" className={inputCls} />
                </Field>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b6e78]">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#8fadb4]" strokeWidth={2} />
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      required minLength={8} placeholder="Mínimo 8 caracteres"
                      className="w-full h-11 pl-11 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-[#071519] placeholder:text-gray-300 focus:outline-none focus:border-[#0b6e78] focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,110,120,0.12)] transition-all" />
                    <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8fadb4] hover:text-[#071519] transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Field label="Perfil" icon={Briefcase}>
                  <select value={role} onChange={e => setRole(e.target.value as 'architect' | 'lojista')}
                    className={inputCls + ' appearance-none cursor-pointer'}>
                    <option value="architect">Arquitecto</option>
                    <option value="lojista">Comerciante</option>
                  </select>
                </Field>
                <Feedback />
                <button type="submit" disabled={loading}
                  className="w-full h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,110,120,0.35)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-2"
                  style={{ background: 'linear-gradient(135deg,#0b6e78 0%,#134e56 100%)' }}>
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* ── REGISTRO PASO 2 ──────────────────────────────────────── */}
          {mode === 'register' && step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => { setStep(1); setError(null); }}
                  className="flex items-center gap-1.5 text-sm text-[#0b6e78] hover:underline">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-[#7a9099]">Paso 2 de 2</span>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-[#071519] leading-tight">
                  {role === 'architect' ? 'Datos del Arquitecto' : 'Datos del Comerciante'}
                </h1>
                <p className="text-[#7a9099] text-sm mt-1">Complete su perfil profesional</p>
              </div>

              {role === 'architect' ? (
                <form onSubmit={handleRegisterStep2} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Nombre Completo *" icon={User}>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre completo del arquitecto" className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="N.° CI *" icon={CreditCard}>
                        <input type="text" value={documentCi} onChange={e => setDocumentCi(e.target.value)} required placeholder="CI del arquitecto" className={inputCls} />
                      </Field>
                      <Field label="RUC Oficina *" icon={CreditCard}>
                        <input type="text" value={ruc} onChange={e => setRuc(e.target.value)} required placeholder="RUC" className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Oficina / Empresa *" icon={Building2}>
                      <input type="text" value={company} onChange={e => setCompany(e.target.value)} required placeholder="Nombre de la oficina" className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tel. Arquitecto *" icon={Phone}>
                        <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} required placeholder="+595..." className={inputCls} />
                      </Field>
                      <Field label="Tel. Oficina" icon={Phone}>
                        <input type="tel" value={officePhone} onChange={e => setOfficePhone(e.target.value)} placeholder="+595..." className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Dirección de la Oficina" icon={MapPin}>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle, número, barrio" className={inputCls} />
                    </Field>
                    <Field label="Ciudad" icon={MapPin}>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad" className={inputCls} />
                    </Field>
                    <Field label="Fecha de Cumpleaños *" icon={Calendar}>
                      <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} required className={inputCls} />
                    </Field>
                  </div>
                  <Feedback />
                  <SubmitBtn label="Crear cuenta" />
                </form>
              ) : (
                <form onSubmit={handleRegisterStep2} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Nombre del Responsable *" icon={User}>
                      <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} required placeholder="Nombre completo" className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="CI del Responsable *" icon={CreditCard}>
                        <input type="text" value={ownerCi} onChange={e => setOwnerCi(e.target.value)} required placeholder="CI" className={inputCls} />
                      </Field>
                      <Field label="RUC del Socio Exclusivo *" icon={CreditCard}>
                        <input type="text" value={storeRuc} onChange={e => setStoreRuc(e.target.value)} required placeholder="RUC" className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Nombre del Socio Exclusivo *" icon={Building2}>
                      <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required placeholder="Nombre del socio exclusivo" className={inputCls} />
                    </Field>
                    <Field label="RUC Empresa" icon={CreditCard}>
                      <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="RUC de la empresa" className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tel. Responsable *" icon={Phone}>
                        <input type="tel" value={storePhone} onChange={e => setStorePhone(e.target.value)} required placeholder="+595..." className={inputCls} />
                      </Field>
                      <Field label="Tel. Tienda" icon={Phone}>
                        <input type="tel" value={storeOfficePhone} onChange={e => setStoreOfficePhone(e.target.value)} placeholder="+595..." className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Dirección del Socio Exclusivo" icon={MapPin}>
                      <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="Dirección completa" className={inputCls} />
                    </Field>
                    <Field label="Ciudad" icon={MapPin}>
                      <input type="text" value={storeCity} onChange={e => setStoreCity(e.target.value)} placeholder="Ciudad" className={inputCls} />
                    </Field>
                    <Field label="Fecha de Cumpleaños *" icon={Calendar}>
                      <input type="date" value={ownerBirthday} onChange={e => setOwnerBirthday(e.target.value)} required className={inputCls} />
                    </Field>
                  </div>
                  <Feedback />
                  <SubmitBtn label="Crear cuenta" />
                </form>
              )}
            </>
          )}

          <p className="mt-5 text-center text-[11px] text-gray-300">
            Al continuar, acepta los términos de uso de la plataforma CONNECTUS.
          </p>
        </div>
      </div>
    </div>
  );
}
