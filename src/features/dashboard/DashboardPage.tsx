import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DayTimeList, WeekTimeList } from '../../components/TimeBars';
import { EmptyState } from '../../components/EmptyState';
import { IconAlert } from '../../components/icons';
import { useData } from '../../data/DataProvider';
import { formatDateLong, formatWeekRange, parseISODate, startOfDay } from '../../lib/dates';
import { formatDuration, formatMinutes } from '../../lib/format';
import { bucketTasks, effectiveTargets, sumByArea, totalOf } from '../../lib/stats';
import { QuickAdd } from '../tasks/QuickAdd';
import { TaskList } from '../tasks/TaskList';

const UPCOMING_PREVIEW = 6;

export function DashboardPage() {
  const { tasks, entries, goals, today, weekStart } = useData();

  const buckets = useMemo(() => bucketTasks(tasks, today), [tasks, today]);
  const dayTotals = useMemo(() => sumByArea(entries, startOfDay(parseISODate(today))), [entries, today]);
  const weekTotals = useMemo(() => sumByArea(entries, parseISODate(weekStart)), [entries, weekStart]);
  const targets = useMemo(() => effectiveTargets(goals, weekStart), [goals, weekStart]);

  const openToday = buckets.today.filter((t) => t.status === 'TODO').length;
  const doneToday = buckets.today.length - openToday;

  const codingLimit = targets.coding;
  const codingOver = codingLimit > 0 && weekTotals.coding > codingLimit * 60;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hôm nay</h1>
          <p className="page-sub">{formatDateLong(today)}</p>
        </div>
      </div>

      <div className="stack">
        {buckets.overdue.length > 0 && (
          <p className="notice">
            <IconAlert />
            <span>
              {buckets.overdue.length} việc quá hạn. <Link to="/tasks?view=overdue">Xem danh sách</Link>
            </span>
          </p>
        )}

        <div className="cols">
          <div className="stack">
            <section aria-labelledby="today-h">
              <div className="section-head">
                <h2 id="today-h">Việc hôm nay</h2>
                {buckets.today.length > 0 && (
                  <span className="section-note">
                    {openToday} còn lại, {doneToday} đã xong
                  </span>
                )}
              </div>
              <QuickAdd defaultDue={today} />
              <TaskList
                tasks={buckets.today}
                empty={
                  <EmptyState
                    title="Hôm nay chưa có việc nào."
                    hint="Lịch trống, tận hưởng nhé. Hoặc thêm việc ở ô phía trên."
                  />
                }
              />
            </section>

            <section aria-labelledby="upcoming-h">
              <div className="section-head">
                <h2 id="upcoming-h">Sắp tới</h2>
                {buckets.upcoming.length > UPCOMING_PREVIEW && (
                  <Link className="section-note" to="/tasks?view=upcoming">
                    Xem tất cả ({buckets.upcoming.length})
                  </Link>
                )}
              </div>
              <TaskList
                tasks={buckets.upcoming.slice(0, UPCOMING_PREVIEW)}
                empty={<EmptyState title="Bảy ngày tới chưa có việc nào có hạn." />}
              />
            </section>
          </div>

          <div className="stack">
            {codingOver && (
              <p className="notice" role="status">
                <IconAlert />
                <span>
                  Tuần này bạn đã vượt giới hạn coding ({formatDuration(weekTotals.coding)} /{' '}
                  {formatMinutes(codingLimit)}). Vẫn bắt đầu focus được, đây chỉ là lời nhắc.
                </span>
              </p>
            )}

            <section aria-labelledby="day-h">
              <div className="section-head">
                <h2 id="day-h">Thời gian hôm nay</h2>
              </div>
              <div className="total-line">
                <span>Tổng đã focus</span>
                <strong>{formatDuration(totalOf(dayTotals))}</strong>
              </div>
              <DayTimeList totals={dayTotals} />
            </section>

            <section aria-labelledby="week-h">
              <div className="section-head">
                <h2 id="week-h">Tuần này</h2>
                <span className="section-note">{formatWeekRange(weekStart)}</span>
              </div>
              <div className="total-line">
                <span>Tổng đã focus</span>
                <strong>{formatDuration(totalOf(weekTotals))}</strong>
              </div>
              <WeekTimeList totals={weekTotals} targets={targets} />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
