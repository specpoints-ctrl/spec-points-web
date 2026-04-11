import { useEffect, useRef, useState } from 'react';
import {
  Camera, Loader2, CheckCircle2, AlertCircle, User, Lock, Mail,
} from 'lucide-react';
import {
  getProfile, updateProfile, uploadImage, updateEmailApi, UserProfile,
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { useProfile } from '../contexts/ProfileContext';
import {
  EmailAuthProvider, reauthenticateWithCredential,
  updatePassword as fbUpdatePassword, updateEmail as fbUpdateEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshProfile } = useProfile();

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPwd, setEmailPwd] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.success && res.data) {
          setProfile(res.data);
          setDisplayName(res.data.display_name ?? '');
        }
      })
      .catch((err) => {
        console.error('[SettingsPage] getProfile failed:', err);
      });
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null); setSuccess(null); setUploadProgress(0);
    try {
      const url = await uploadImage(file, 'avatars', setUploadProgress);
      const res = await updateProfile({ avatar_url: url });
      if (res.success) {
        setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
        setSuccess('Foto atualizada com sucesso!');
        await refreshProfile();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da foto.');
    } finally {
      setUploading(false); setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true); setError(null); setSuccess(null);
    try {
      const res = await updateProfile({ display_name: displayName.trim() });
      if (res.success) {
        setSuccess('Nome atualizado com sucesso!');
        setProfile((prev) => prev ? { ...prev, display_name: displayName.trim() } : prev);
        await refreshProfile();
      }
    } catch {
      setError('Erro ao salvar nome.');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null); setPwdSuccess(null);
    if (newPwd.length < 8) { setPwdError('Nova senha deve ter no mínimo 8 caracteres'); return; }
    if (newPwd !== confirmPwd) { setPwdError('As senhas não coincidem'); return; }
    setSavingPwd(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Usuário não autenticado');
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, credential);
      await fbUpdatePassword(user, newPwd);
      setPwdSuccess('Senha alterada com sucesso!');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwdError('Senha atual incorreta.');
      } else {
        setPwdError(err.message || 'Erro ao alterar senha.');
      }
    } finally {
      setSavingPwd(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null); setEmailSuccess(null);
    if (!newEmail.includes('@')) { setEmailError('Email inválido'); return; }
    setSavingEmail(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Usuário não autenticado');
      const credential = EmailAuthProvider.credential(user.email, emailPwd);
      await reauthenticateWithCredential(user, credential);
      await fbUpdateEmail(user, newEmail);
      await updateEmailApi(newEmail);
      setEmailSuccess('Email alterado com sucesso!');
      setProfile((prev) => prev ? { ...prev, email: newEmail } : prev);
      setNewEmail(''); setEmailPwd('');
      await refreshProfile();
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setEmailError('Senha incorreta.');
      } else if (err.code === 'auth/email-already-in-use') {
        setEmailError('Este email já está em uso.');
      } else {
        setEmailError(err.message || 'Erro ao alterar email.');
      }
    } finally {
      setSavingEmail(false);
    }
  };

  const initial = ((profile?.display_name || profile?.email || '?')[0] ?? '?').toUpperCase();

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-border/60 bg-white/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all duration-200';
  const btnCls = 'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-[hsl(var(--primary)/0.82)] text-primary-foreground text-sm font-semibold shadow-btn-primary hover:shadow-btn-hover hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none border-t border-white/15';

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil e preferências</p>
      </div>

      {/* Global feedback */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
        </div>
      )}

      {/* Avatar */}
      <Card>
        <CardHeader><CardTitle>Foto de Perfil</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-sidebar-accent to-[#c4956a] flex items-center justify-center shadow-card">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-white">{initial}</span>}
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">JPG, PNG ou WebP. Máximo 5MB.</p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className={btnCls}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploading ? `Enviando ${uploadProgress}%...` : 'Alterar foto'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display name */}
      <Card>
        <CardHeader><CardTitle>Nome de Exibição</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nome</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Seu nome" maxLength={255} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">E-mail</label>
              <input type="text" value={profile?.email ?? ''} disabled
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-muted/30 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Perfil</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border/40 bg-muted/30">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">{profile?.role ?? '—'}</span>
              </div>
            </div>
            <button onClick={handleSaveName} disabled={savingName || !displayName.trim()} className={btnCls}>
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {savingName ? 'Salvando...' : 'Salvar nome'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="w-4 h-4" /> Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwdError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />{pwdSuccess}
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Senha Atual</label>
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required
                placeholder="Sua senha atual" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nova Senha</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8}
                placeholder="Mínimo 8 caracteres" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Confirmar Nova Senha</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required
                placeholder="Repita a nova senha" className={inputCls} />
            </div>
            <button type="submit" disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd} className={btnCls}>
              {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {savingPwd ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Change email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> Alterar Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            {emailError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />{emailSuccess}
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Novo Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                placeholder="novo@email.com" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Confirmar com Senha</label>
              <input type="password" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} required
                placeholder="Sua senha atual" className={inputCls} />
            </div>
            <button type="submit" disabled={savingEmail || !newEmail || !emailPwd} className={btnCls}>
              {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {savingEmail ? 'Alterando...' : 'Alterar email'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
