import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  checkReadiness,
  detectShell,
  isStandalone,
  type InstallReadiness,
  type Shell,
} from '../lib/browser'
import { getPrompt, runPrompt, subscribe, wasInstalled } from '../lib/installPrompt'

export { isStandalone } from '../lib/browser'

export function useInstall() {
  const canPrompt = useSyncExternalStore(
    subscribe,
    () => getPrompt() !== null,
    () => false,
  )
  const promptInstalled = useSyncExternalStore(
    subscribe,
    () => wasInstalled(),
    () => false,
  )

  const [shell, setShell] = useState<Shell>(detectShell)
  const [readiness, setReadiness] = useState<InstallReadiness | null>(null)

  useEffect(() => {
    let alive = true
    void checkReadiness().then((r) => {
      if (!alive) return
      setReadiness(r)
      setShell(r.shell)
    })
    return () => {
      alive = false
    }
  }, [])

  const install = useCallback(() => runPrompt(), [])

  return {
    canPrompt,
    install,
    installed: promptInstalled || isStandalone() || shell === 'installed',
    shell,
    readiness,
  }
}
