import { useState, useEffect, useCallback } from 'react'
import { type Task } from '../types'

const STORAGE_KEY = 'daily-planner-tasks'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // storage full or unavailable
    }
  }, [tasks])

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [
      ...prev,
      { ...task, id: crypto.randomUUID(), createdAt: Date.now() },
    ])
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  return { tasks, addTask, toggleTask, deleteTask, updateTask }
}
