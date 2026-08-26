import { useEffect, useRef, useCallback } from 'react'
import { type Task } from '../types'
import { format } from 'date-fns'

export function useNotifications(tasks: Task[]) {
  const firedRef = useRef<Set<string>>(new Set())

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    const result = await Notification.requestPermission()
    return result
  }, [])

  const scheduleNotification = useCallback((task: Task) => {
    if (!task.time || !task.reminderSet) return
    if (Notification.permission !== 'granted') return

    const [h, m] = task.time.split(':').map(Number)
    const fireAt = new Date(task.date)
    fireAt.setHours(h, m - 5, 0, 0) // 5 minutes before

    const now = new Date()
    const delay = fireAt.getTime() - now.getTime()
    if (delay <= 0) return

    const key = `${task.id}-${task.time}`
    if (firedRef.current.has(key)) return

    const timerId = setTimeout(() => {
      new Notification(`⏰ まもなく: ${task.title}`, {
        body: `${format(new Date(task.date), 'M月d日')} ${task.time} の予定です`,
        icon: '/favicon.svg',
        tag: key,
      })
      firedRef.current.add(key)
    }, delay)

    return () => clearTimeout(timerId)
  }, [])

  useEffect(() => {
    const cleanups: Array<(() => void) | undefined> = []
    const today = format(new Date(), 'yyyy-MM-dd')
    for (const task of tasks) {
      if (task.date === today && task.reminderSet && !task.completed) {
        cleanups.push(scheduleNotification(task))
      }
    }
    return () => cleanups.forEach(fn => fn?.())
  }, [tasks, scheduleNotification])

  return { requestPermission, permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported' }
}
