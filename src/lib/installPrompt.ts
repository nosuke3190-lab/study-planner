/**
 * Chrome は読み込みの途中で一度だけ beforeinstallprompt を投げてくる。
 * 画面が組み上がってから待ち構えても間に合わないので、
 * main.tsx から真っ先に読み込んで、ここで受け止めておく。
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()

function announce() {
  for (const fn of listeners) fn()
}

export function startCapturing() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    announce()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    announce()
  })
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getPrompt(): BeforeInstallPromptEvent | null {
  return deferred
}

export function wasInstalled(): boolean {
  return installed
}

export async function runPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  const event = deferred
  deferred = null
  announce()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}
