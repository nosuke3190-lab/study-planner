import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * localStorage に載せた state。
 * 保存に失敗しても画面は動き続け、失敗したことだけ呼び出し側に伝える。
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T,
): [T, (update: T | ((prev: T) => T)) => void, { failed: boolean }] {
  const [failed, setFailed] = useState(false)
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return initial
      const parsed: unknown = JSON.parse(raw)
      return revive ? revive(parsed) : (parsed as T)
    } catch {
      return initial
    }
  })

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      // 初回は読み込んだ値をそのまま書き戻さない（容量を無駄に使わないため）
      return
    }
    try {
      localStorage.setItem(key, JSON.stringify(value))
      // 同じ値を返すと React は再描画しないので、普段は何も起きない
      setFailed((f) => (f ? false : f))
    } catch {
      setFailed((f) => (f ? f : true))
    }
  }, [key, value])

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next))
  }, [])

  return [value, update, { failed }]
}

export function clearAllData(keys: string[]) {
  for (const k of keys) {
    try {
      localStorage.removeItem(k)
    } catch {
      // 消せなくても続行する
    }
  }
}
