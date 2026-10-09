import { Link, NavLink, Outlet } from 'react-router-dom';
import { useData } from '../data/DataProvider';
import { useAuth } from '../features/auth/AuthProvider';
import { useTimer } from '../features/focus/TimerProvider';
import { formatClock } from '../lib/format';
import { IconDashboard, IconFocus, IconGoals, IconLogout, IconProjects, IconTasks } from './icons';

export function Layout() {
  const { session, signOut } = useAuth();
  const { status, error, reload } = useData();
  const { timer, elapsed, isRunning } = useTimer();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Bỏ qua điều hướng
      </a>

      <aside className="side">
        <div className="brand">Lịch học</div>

        <nav className="nav" aria-label="Điều hướng chính">
          <NavLink to="/" end>
            <IconDashboard />
            <span>Tổng quan</span>
          </NavLink>
          <NavLink to="/tasks">
            <IconTasks />
            <span>Công việc</span>
          </NavLink>
          <NavLink to="/projects">
            <IconProjects />
            <span>Dự án</span>
          </NavLink>
          <NavLink to="/focus">
            <IconFocus />
            <span>Focus</span>
          </NavLink>
          <NavLink to="/goals">
            <IconGoals />
            <span>Mục tiêu</span>
          </NavLink>
        </nav>

        <div className="side-foot">
          {timer && (
            <Link
              to="/focus"
              className="timer-chip"
              aria-label={`Phiên focus ${isRunning ? 'đang chạy' : 'đang tạm dừng'}, ${formatClock(elapsed)}`}
            >
              <IconFocus width={18} height={18} />
              {formatClock(elapsed)}
              {!isRunning && <span>(tạm dừng)</span>}
            </Link>
          )}
          <span className="side-email">{session?.user.email}</span>
          <button type="button" className="btn btn-quiet signout" onClick={() => void signOut()}>
            <IconLogout width={18} height={18} />
            <span className="signout-label">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main id="main" className="page">
        {status === 'loading' && <p className="loading">Đang tải dữ liệu…</p>}
        {status === 'error' && (
          <div className="notice" role="alert">
            <div>
              <p>
                <strong>Không tải được dữ liệu.</strong> {error}
              </p>
              <p style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => void reload()}>
                  Thử lại
                </button>
              </p>
            </div>
          </div>
        )}
        {status === 'ready' && <Outlet />}
      </main>
    </div>
  );
}
