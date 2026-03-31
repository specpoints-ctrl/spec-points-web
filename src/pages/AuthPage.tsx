import { FormEvent, useState } from 'react';
import { isAxiosError } from 'axios';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { registerUser, validateLoginStatus } from '../lib/api';

type Mode = 'login' | 'register';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'architect' | 'lojista'>('architect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getApiErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError<{ error?: string; message?: string }>(err)) {
      const apiMessage = err.response?.data?.error || err.response?.data?.message;
      if (apiMessage) {
        return apiMessage;
      }
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return fallback;
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerUser({
        name,
        email,
        password,
        role,
      });

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

    if (mode === 'login') {
      await handleLogin();
      return;
    }

    await handleRegister();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">SpecPoints</h1>
        <p className="text-gray-500 text-center mt-2 mb-8">
          {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              mode === 'register'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="voce@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="********"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as 'architect' | 'lojista')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="architect">Arquiteto</option>
                <option value="lojista">Lojista</option>
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading
              ? 'Processando...'
              : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
