import { useMemo } from 'react'
import { lastDays, todayStr, weekdayLabel } from '../lib/date'
import type { Completion } from '../types'

const PLOT = 96
const TOP = 116

/**
 * 直近 7 日の完了タスク数。1 本の系列なので色は 1 つだけ、
 * 数字は今日と最大の日にだけ置いて、残りは平均線で読ませる。
 */
export default function CompletionChart({ completions }: { completions: Completion[] }) {
  const today = todayStr()
  const days = useMemo(() => lastDays(7, today), [today])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of completions) map.set(c.date, (map.get(c.date) ?? 0) + 1)
    return days.map((d) => ({ date: d, value: map.get(d) ?? 0 }))
  }, [completions, days])

  const max = Math.max(1, ...counts.map((c) => c.value))
  const total = counts.reduce((sum, c) => sum + c.value, 0)
  const avg = total / counts.length
  const avgY = Math.round((avg / max) * PLOT)
  const anyData = total > 0

  return (
    <figure className="m-0">
      <figcaption>
        <h2 className="text-[13.5px] font-bold">完了タスク数の推移</h2>
        <p className="mt-0.5 text-[11px] text-ink3">
          直近7日{anyData && <> ・ 平均 <span className="num">{avg.toFixed(1)}</span> 件</>}
        </p>
      </figcaption>

      {anyData ? (
        <>
          <div className="relative mt-3.5" style={{ height: TOP }}>
            <div
              className="absolute inset-x-0 border-t border-dashed border-linestrong"
              style={{ bottom: avgY }}
            />
            <div className="absolute inset-0 flex items-end gap-2.5">
              {counts.map((c) => {
                const isToday = c.date === today
                const show = isToday || (c.value === max && max > 0)
                return (
                  <div key={c.date} className="flex flex-1 flex-col items-center justify-end gap-1">
                    {show && (
                      <span className="num text-[11px] font-medium leading-none">{c.value}</span>
                    )}
                    <div
                      className="w-full rounded-t bg-task"
                      style={{ height: Math.round((c.value / max) * PLOT) }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="h-px bg-linestrong" />
          <div className="mt-1.5 flex gap-2.5">
            {counts.map((c) => (
              <span
                key={c.date}
                className={`flex-1 text-center text-[11px] ${
                  c.date === today ? 'font-bold text-ink' : 'text-ink3'
                }`}
              >
                {weekdayLabel(c.date)}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>完了タスク数の推移（直近7日）</caption>
            <tbody>
              {counts.map((c) => (
                <tr key={c.date}>
                  <th scope="row">{c.date}</th>
                  <td>{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="mt-4 text-[12px] leading-relaxed text-ink3">
          タスクを片付けると、ここに7日分の棒グラフが出ます。
        </p>
      )}
    </figure>
  )
}
