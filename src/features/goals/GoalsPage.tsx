import { useMemo, useState, type FormEvent } from 'react';
import { IconAlert, IconCheck } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { useData } from '../../data/DataProvider';
import { AREAS } from '../../lib/areas';
import { formatWeekRange, parseISODate } from '../../lib/dates';
import { formatDuration, formatMinutes, hoursToMinutes, minutesToHours } from '../../lib/format';
import { effectiveTargets, sumByArea, type AreaTotals } from '../../lib/stats';
import type { AreaId } from '../../types';

type Draft = Record<AreaId, string>;

function toDraft(targets: AreaTotals): Draft {
  const draft = {} as Draft;
  for (const a of AREAS) {
    draft[a.id] = targets[a.id] > 0 ? String(minutesToHours(targets[a.id])) : '';
  }
  return draft;
}

export function GoalsPage() {
  const { goals, entries, weekStart, saveGoals } = useData();
  const toast = useToast();

  const targets = useMemo(() => effectiveTargets(goals, weekStart), [goals, weekStart]);
  const actual = useMemo(() => sumByArea(entries, parseISODate(weekStart)), [entries, weekStart]);

  const [draft, setDraft] = useState<Draft>(() => toDraft(targets));
  const [errors, setErrors] = useState<Partial<Record<AreaId, string>>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const nextErrors: Partial<Record<AreaId, string>> = {};
    const changed: { area_id: AreaId; target_minutes: number }[] = [];

    for (const a of AREAS) {
      const raw = draft[a.id].trim().replace(',', '.');
      const hours = raw === '' ? 0 : Number(raw);
      if (Number.isNaN(hours) || hours < 0 || hours > 168) {
        nextErrors[a.id] = 'Nhập số giờ từ 0 đến 168.';
        continue;
      }
      const minutes = hoursToMinutes(hours);
      if (minutes !== targets[a.id]) changed.push({ area_id: a.id, target_minutes: minutes });
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (changed.length === 0) {
      toast.info('Chưa có thay đổi nào để lưu.');
      return;
    }

    setBusy(true);
    const ok = await saveGoals(changed);
    setBusy(false);
    if (ok) toast.info('Đã lưu mục tiêu tuần.');
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mục tiêu tuần</h1>
          <p className="page-sub">
            Tuần {formatWeekRange(weekStart)}. Mục tiêu được giữ cho các tuần sau cho đến khi bạn đổi.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ maxWidth: 720 }}>
        <ul className="goal-list">
          {AREAS.map((a) => {
            const isCoding = a.id === 'coding';
            const seconds = actual[a.id];
            const targetMin = targets[a.id];
            const targetSec = targetMin * 60;
            const hasTarget = targetMin > 0;
            const over = hasTarget && seconds > targetSec;
            const reached = hasTarget && !isCoding && seconds >= targetSec;
            const inputId = `goal-${a.id}`;
            const errId = `${inputId}-err`;
            const error = errors[a.id];

            return (
              <li key={a.id}>
                <div className="goal-row">
                  <div>
                    <p className="goal-name">{a.name}</p>
                    <p className="goal-sub">
                      {isCoding
                        ? 'Giới hạn: chỉ nhắc nhẹ khi vượt, không khóa gì cả.'
                        : 'Mục tiêu số giờ tối thiểu mỗi tuần.'}
                    </p>
                    <p className="goal-actual">
                      Đã dùng <strong>{formatDuration(seconds)}</strong>
                      {hasTarget && <> / {formatMinutes(targetMin)}</>}
                      {over && isCoding && (
                        <span className="is-warn">
                          {' '}
                          <IconAlert width={14} height={14} style={{ verticalAlign: '-2px' }} /> Vượt{' '}
                          {formatDuration(seconds - targetSec)}
                        </span>
                      )}
                      {reached && (
                        <span style={{ color: 'var(--accent-ink)', fontWeight: 600 }}>
                          {' '}
                          <IconCheck width={14} height={14} style={{ verticalAlign: '-2px' }} /> Đạt
                        </span>
                      )}
                    </p>
                    {hasTarget && (
                      <div className={isCoding && over ? 'bar is-over' : 'bar'} aria-hidden="true">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.min(100, (seconds / targetSec) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor={inputId}>{isCoding ? 'Giới hạn (giờ/tuần)' : 'Mục tiêu (giờ/tuần)'}</label>
                    <input
                      id={inputId}
                      className="input"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={168}
                      step={0.25}
                      value={draft[a.id]}
                      placeholder="Chưa đặt"
                      aria-invalid={error !== undefined}
                      aria-describedby={error ? errId : undefined}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    />
                    {error && (
                      <p id={errId} className="field-error" role="alert">
                        <IconAlert width={16} height={16} />
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu mục tiêu'}
          </button>
        </div>
      </form>
    </>
  );
}
