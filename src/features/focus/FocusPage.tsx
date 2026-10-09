import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { IconAlert, IconPause, IconPlay, IconStop, IconTrash } from '../../components/icons';
import { useData } from '../../data/DataProvider';
import { AREAS, areaName } from '../../lib/areas';
import { formatTimeOfDay, isOnLocalDay, parseISODate } from '../../lib/dates';
import { formatClock, formatDuration, formatMinutes } from '../../lib/format';
import { readLastArea, rememberArea } from '../../lib/lastArea';
import { effectiveTargets, sumByArea } from '../../lib/stats';
import type { AreaId } from '../../types';
import { useTimer } from './TimerProvider';

const DURATIONS = [15, 25, 45, 60, 90];

function Clock({ seconds, overtime, paused }: { seconds: number; overtime: boolean; paused: boolean }) {
  const text = formatClock(seconds);
  return (
    <div className={paused ? 'clock is-paused' : 'clock'} role="timer">
      <span className="visually-hidden">
        {overtime ? 'Quá giờ ' : 'Còn lại '}
        {text}
      </span>
      <span className="clock-digits" aria-hidden="true">
        {overtime && <span className="sign">+</span>}
        {text.split('').map((ch, i) =>
          ch === ':' ? (
            <span key={i} className="sep">
              :
            </span>
          ) : (
            <span key={i} className="digit">
              {ch}
            </span>
          ),
        )}
      </span>
    </div>
  );
}

export function FocusPage() {
  const { projects, tasks, entries, goals, today, weekStart, removeEntry } = useData();
  const { timer, elapsed, isRunning, start, pause, resume, cancel, finish } = useTimer();

  const [areaId, setAreaId] = useState<AreaId>(readLastArea);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [minutes, setMinutes] = useState(25);
  const [finishing, setFinishing] = useState(false);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const projectOptions = projects.filter(
    (p) => p.area_id === areaId && (p.status === 'ACTIVE' || p.id === projectId),
  );
  const taskOptions = tasks.filter(
    (t) => t.status === 'TODO' && t.area_id === areaId && (projectId === '' || t.project_id === projectId),
  );

  const weekTotals = useMemo(() => sumByArea(entries, parseISODate(weekStart)), [entries, weekStart]);
  const codingLimit = effectiveTargets(goals, weekStart).coding;
  const codingOver = codingLimit > 0 && weekTotals.coding > codingLimit * 60;

  const todaySessions = useMemo(
    () =>
      entries
        .filter((e) => isOnLocalDay(e.started_at, today))
        .sort((a, b) => (a.started_at < b.started_at ? 1 : -1)),
    [entries, today],
  );

  function onAreaChange(next: AreaId) {
    setAreaId(next);
    setProjectId('');
    setTaskId('');
  }

  function onProjectChange(next: string) {
    setProjectId(next);
    const current = taskById.get(taskId);
    if (current && next !== '' && current.project_id !== next) setTaskId('');
  }

  function onTaskChange(next: string) {
    setTaskId(next);
    const t = taskById.get(next);
    if (t) setProjectId(t.project_id ?? '');
  }

  function onStart() {
    rememberArea(areaId);
    start({
      area_id: areaId,
      project_id: projectId === '' ? null : projectId,
      task_id: taskId === '' ? null : taskId,
      plannedSeconds: minutes * 60,
    });
  }

  async function onFinish() {
    if (finishing) return;
    setFinishing(true);
    await finish();
    setFinishing(false);
  }

  function onCancel() {
    if (window.confirm('Hủy phiên này? Thời gian đã chạy sẽ không được lưu.')) cancel();
  }

  async function onDeleteSession(id: string) {
    if (window.confirm('Xóa phiên focus này khỏi thống kê?')) await removeEntry(id);
  }

  const showCodingWarning = !timer && areaId === 'coding' && codingOver;

  return (
    <>
      <div className="page-head">
        <h1>Focus</h1>
      </div>

      {timer ? (
        <section className="focus-run" aria-label="Phiên focus đang diễn ra">
          <p className="focus-label">
            <strong>{areaName(timer.area_id)}</strong>
            {timer.project_id && projectById.get(timer.project_id) && (
              <> / {projectById.get(timer.project_id)?.name}</>
            )}
            {timer.task_id && taskById.get(timer.task_id) && <> / {taskById.get(timer.task_id)?.title}</>}
          </p>

          <Clock
            seconds={Math.abs(timer.plannedSeconds - elapsed)}
            overtime={elapsed > timer.plannedSeconds}
            paused={!isRunning}
          />

          <p className="focus-state" aria-live="polite">
            {!isRunning
              ? 'Đang tạm dừng'
              : elapsed > timer.plannedSeconds
                ? 'Đã quá giờ dự kiến. Kết thúc khi bạn sẵn sàng.'
                : `Đã chạy ${formatDuration(elapsed)} trên ${formatMinutes(Math.round(timer.plannedSeconds / 60))}`}
          </p>

          <div className="focus-actions">
            {isRunning ? (
              <button type="button" className="btn btn-outline btn-lg" onClick={pause}>
                <IconPause />
                Tạm dừng
              </button>
            ) : (
              <button type="button" className="btn btn-outline btn-lg" onClick={resume}>
                <IconPlay />
                Tiếp tục
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => void onFinish()}
              disabled={finishing}
            >
              <IconStop />
              {finishing ? 'Đang lưu…' : 'Kết thúc và lưu'}
            </button>
            <button type="button" className="btn btn-quiet" onClick={onCancel} disabled={finishing}>
              Hủy phiên
            </button>
          </div>
        </section>
      ) : (
        <section className="focus-setup" aria-label="Bắt đầu phiên focus">
          {showCodingWarning && (
            <p className="notice" role="status" style={{ marginBottom: 'var(--s5)' }}>
              <IconAlert />
              <span>
                Tuần này bạn đã vượt giới hạn coding ({formatDuration(weekTotals.coding)} /{' '}
                {formatMinutes(codingLimit)}). Vẫn bắt đầu được, đây chỉ là lời nhắc.
              </span>
            </p>
          )}

          <div className="form-grid">
            <div className="field">
              <label htmlFor="focus-area">Lĩnh vực</label>
              <select
                id="focus-area"
                className="select"
                value={areaId}
                onChange={(e) => onAreaChange(e.target.value as AreaId)}
              >
                {AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="focus-duration">Thời lượng</label>
              <select
                id="focus-duration"
                className="select"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} phút
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="focus-project">Project (không bắt buộc)</label>
              <select
                id="focus-project"
                className="select"
                value={projectId}
                onChange={(e) => onProjectChange(e.target.value)}
              >
                <option value="">Không chọn</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="focus-task">Việc (không bắt buộc)</label>
              <select
                id="focus-task"
                className="select"
                value={taskId}
                onChange={(e) => onTaskChange(e.target.value)}
              >
                <option value="">Không chọn</option>
                {taskOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
              <IconPlay />
              Bắt đầu
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="sessions-h" style={{ marginTop: 'var(--s7)' }}>
        <div className="section-head">
          <h2 id="sessions-h">Các phiên hôm nay</h2>
        </div>
        {todaySessions.length === 0 ? (
          <EmptyState
            title="Hôm nay chưa có phiên focus nào."
            hint="Mỗi phiên kết thúc sẽ được lưu ở đây và cộng vào thống kê."
            action={
              <Link className="btn btn-outline" to="/">
                Xem tổng quan
              </Link>
            }
          />
        ) : (
          <ul className="session-list">
            {todaySessions.map((s) => {
              const project = s.project_id ? projectById.get(s.project_id) : undefined;
              const task = s.task_id ? taskById.get(s.task_id) : undefined;
              const detail = [project?.name, task?.title].filter(Boolean).join(' / ');
              return (
                <li key={s.id}>
                  <span className="session-time">{formatTimeOfDay(s.started_at)}</span>
                  <span className="session-what">
                    {areaName(s.area_id)}
                    {detail && <small>{detail}</small>}
                  </span>
                  <span className="session-dur">{formatDuration(s.duration_seconds)}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Xóa phiên ${areaName(s.area_id)} lúc ${formatTimeOfDay(s.started_at)}`}
                    onClick={() => void onDeleteSession(s.id)}
                  >
                    <IconTrash />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
