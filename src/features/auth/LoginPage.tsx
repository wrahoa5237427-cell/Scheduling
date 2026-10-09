import { useState, type FormEvent } from 'react';
import { IconAlert } from '../../components/icons';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
      } else {
        const res = await signUp(email.trim(), password);
        if (res.error) setError(res.error);
        else if (res.needsConfirm) setInfo('Đã tạo tài khoản. Hãy mở email để xác nhận, sau đó đăng nhập.');
      }
    } catch {
      setError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <main className="center-screen">
      <div className="auth-box">
        <h1>{isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
        <p className="page-sub">Lịch học: việc cần làm hôm nay và thời gian của bạn đang đi đâu.</p>

        <form onSubmit={onSubmit} noValidate={false}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mật khẩu{isSignup ? ' (ít nhất 8 ký tự)' : ''}</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="field-error" role="alert">
              <IconAlert width={18} height={18} />
              {error}
            </p>
          )}
          {info && (
            <p className="notice notice-calm" role="status">
              {info}
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Đang xử lý…' : isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(isSignup ? 'signin' : 'signup');
              setError(null);
              setInfo(null);
            }}
          >
            {isSignup ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </p>
      </div>
    </main>
  );
}
