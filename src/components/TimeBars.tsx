import { Link } from 'react-router-dom';
import { AREAS } from '../lib/areas';
import { formatDuration, formatMinutes } from '../lib/format';
import type { AreaTotals } from '../lib/stats';
import { IconAlert, IconCheck } from './icons';

function Bar({ percent, over }: { percent: number; over?: boolean }) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className={over ? 'bar is-over' : 'bar'} aria-hidden="true">
      <div className="bar-fill" style={{ width: `${width}%` }} />
    </div>
  );
}

/** Thời gian trong ngày theo area; thanh so sánh tương đối giữa các area. */
export function DayTimeList({ totals }: { totals: AreaTotals }) {
  const max = Math.max(1, ...AREAS.map((a) => totals[a.id]));
  return (
    <ul className="time-list">
      {AREAS.map((a) => {
        const seconds = totals[a.id];
        return (
          <li key={a.id}>
            <div className="time-row">
              <span className="time-name">{a.name}</span>
              <span className={seconds === 0 ? 'time-value is-muted' : 'time-value'}>
                <strong>{formatDuration(seconds)}</strong>
              </span>
            </div>
            <Bar percent={(seconds / max) * 100} />
          </li>
        );
      })}
    </ul>
  );
}

/** Thời gian trong tuần theo area; có mục tiêu thì hiện tiến độ. Coding dùng ngữ nghĩa "giới hạn". */
export function WeekTimeList({ totals, targets }: { totals: AreaTotals; targets: AreaTotals }) {
  return (
    <ul className="time-list">
      {AREAS.map((a) => {
        const seconds = totals[a.id];
        const targetMin = targets[a.id];
        const hasTarget = targetMin > 0;
        const targetSec = targetMin * 60;
        const isCoding = a.id === 'coding';
        const over = hasTarget && seconds > targetSec;
        const reached = hasTarget && !isCoding && seconds >= targetSec;

        return (
          <li key={a.id}>
            <div className="time-row">
              <span className="time-name">{a.name}</span>
              <span className={seconds === 0 && !hasTarget ? 'time-value is-muted' : 'time-value'}>
                <strong>{formatDuration(seconds)}</strong>
                {hasTarget && <> / {formatMinutes(targetMin)}</>}
              </span>
            </div>

            {hasTarget && <Bar percent={(seconds / targetSec) * 100} over={isCoding && over} />}

            {hasTarget && isCoding && (
              <p className={over ? 'time-hint is-warn-text' : 'time-hint'}>
                {over ? (
                  <>
                    <IconAlert width={14} height={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                    Vượt giới hạn {formatDuration(seconds - targetSec)}
                  </>
                ) : (
                  <>Còn {formatDuration(targetSec - seconds)} trong giới hạn</>
                )}
              </p>
            )}
            {hasTarget && !isCoding && (
              <p className="time-hint">
                {reached ? (
                  <>
                    <IconCheck width={14} height={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                    Đạt mục tiêu
                  </>
                ) : (
                  <>Còn {formatDuration(targetSec - seconds)} để đạt mục tiêu</>
                )}
              </p>
            )}
            {!hasTarget && isCoding && (
              <p className="time-hint">
                Chưa đặt giới hạn. <Link to="/goals">Đặt giới hạn coding</Link>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
