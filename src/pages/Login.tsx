import { ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-soft sm:p-8">
        <div className="mb-6 flex justify-end">
          <LanguageToggle />
        </div>
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="page-title">{t('auth.adminLogin')}</h1>
            <p className="text-sm text-gray-500">{t('auth.dashboardAccess')}</p>
          </div>
        </div>
        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="label">{t('common.email')}</span>
            <input
              type="email"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="label">{t('common.password')}</span>
            <input
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
      </div>
    </main>
  );
}
