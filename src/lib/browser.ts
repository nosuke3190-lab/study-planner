/** いまどの入れ物で開かれているか。ホーム画面に追加できるかはこれで決まる */
export type Shell =
  | 'installed' // すでにホーム画面から開いている
  | 'ios-safari' // iPhone / iPad の Safari
  | 'ios-other' // iPhone の Chrome など。ここからは追加できない
  | 'in-app' // LINE や X のアプリの中のブラウザ。追加できない
  | 'android-chrome'
  | 'desktop'
  | 'unknown'

function ua(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true
  const displayMode =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches)
  return displayMode || iosStandalone
}

export function isIOS(): boolean {
  const s = ua()
  if (!s) return false
  const iPadOS = /Macintosh/.test(s) && (navigator.maxTouchPoints ?? 0) > 1
  return /iPad|iPhone|iPod/.test(s) || iPadOS
}

export function isAndroid(): boolean {
  return /Android/.test(ua())
}

/** アプリの中に埋め込まれたブラウザ。ここからは追加できない */
export function isInAppBrowser(): boolean {
  const s = ua()
  return /Line\/|FBAN|FBAV|FB_IAB|Instagram|Twitter|TwitterAndroid|MicroMessenger|KAKAOTALK|NAVER|Snapchat|Pinterest/i.test(
    s,
  )
}

export function detectShell(): Shell {
  if (isStandalone()) return 'installed'
  if (isInAppBrowser()) return 'in-app'
  const s = ua()
  if (isIOS()) {
    // iOS では Safari 以外から追加しても、ただのブックマークになる
    const notSafari = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Brave/i.test(s)
    return notSafari ? 'ios-other' : 'ios-safari'
  }
  if (isAndroid()) return 'android-chrome'
  if (s) return 'desktop'
  return 'unknown'
}

/** 追加できない理由を探すための、その場の状態 */
export interface InstallReadiness {
  https: boolean
  manifestLinked: boolean
  manifestOk: boolean | null
  serviceWorker: boolean | null
  standalone: boolean
  shell: Shell
  userAgent: string
}

export async function checkReadiness(): Promise<InstallReadiness> {
  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  let manifestOk: boolean | null = null
  if (link?.href) {
    try {
      const res = await fetch(link.href, { cache: 'no-store' })
      manifestOk = res.ok && typeof (await res.json()).name === 'string'
    } catch {
      manifestOk = false
    }
  }

  let serviceWorker: boolean | null = null
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      serviceWorker = !!reg?.active
    } catch {
      serviceWorker = false
    }
  } else {
    serviceWorker = false
  }

  return {
    https: location.protocol === 'https:' || location.hostname === 'localhost',
    manifestLinked: !!link,
    manifestOk,
    serviceWorker,
    standalone: isStandalone(),
    shell: detectShell(),
    userAgent: ua(),
  }
}
