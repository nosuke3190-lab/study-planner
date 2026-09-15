import { sendPush, type PushSubscription } from './push'

export interface Env {
  SUBS: KVNamespace
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
  /** アプリを置いた URL。ここからの呼び出しだけ受ける */
  ALLOWED_ORIGIN: string
}

interface ScheduleEntry {
  id: string
  title: string
  body: string
  /** epoch ミリ秒 */
  at: number
}

interface StoredSub {
  subscription: PushSubscription
  schedule: ScheduleEntry[]
  updatedAt: number
}

/** 予定を持てる上限。1 端末が KV を埋め尽くさないように */
const MAX_ENTRIES = 500
/** 送り損ねた分をどこまで遡って出すか */
const GRACE_MS = 10 * 60 * 1000

function cors(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data: unknown, env: Env, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...cors(env) },
  })
}

async function keyFor(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  const bytes = new Uint8Array(digest)
  let s = ''
  for (const b of bytes) s += b.toString(16).padStart(2, '0')
  return 'sub:' + s.slice(0, 32)
}

function cleanSchedule(raw: unknown): ScheduleEntry[] {
  if (!Array.isArray(raw)) return []
  const out: ScheduleEntry[] = []
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue
    const { id, title, body, at } = e as Partial<ScheduleEntry>
    if (typeof id !== 'string' || typeof at !== 'number' || !Number.isFinite(at)) continue
    out.push({
      id: id.slice(0, 120),
      title: String(title ?? 'Mindeck').slice(0, 80),
      body: String(body ?? '').slice(0, 200),
      at,
    })
    if (out.length >= MAX_ENTRIES) break
  }
  return out.sort((a, b) => a.at - b.at)
}

function validSubscription(raw: unknown): PushSubscription | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<PushSubscription>
  if (typeof s.endpoint !== 'string' || !s.endpoint.startsWith('https://')) return null
  if (!s.keys || typeof s.keys.p256dh !== 'string' || typeof s.keys.auth !== 'string') return null
  return { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }
}

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) })
  if (url.pathname === '/health') return json({ ok: true }, env)
  if (request.method !== 'POST') return json({ error: 'POST だけ受け付けます' }, env, 405)

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'JSON として読めません' }, env, 400)
  }

  if (url.pathname === '/subscribe') {
    const sub = validSubscription(payload.subscription)
    if (!sub) return json({ error: 'subscription が足りません' }, env, 400)
    const key = await keyFor(sub.endpoint)
    await env.SUBS.put(
      key,
      JSON.stringify({
        subscription: sub,
        schedule: cleanSchedule(payload.schedule),
        updatedAt: Date.now(),
      }),
    )
    return json({ ok: true }, env)
  }

  if (url.pathname === '/schedule') {
    const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint : ''
    if (!endpoint) return json({ error: 'endpoint が要ります' }, env, 400)
    const key = await keyFor(endpoint)
    const existing = await env.SUBS.get(key, 'json')
    if (!existing) return json({ error: 'まだ登録されていません' }, env, 404)
    const record = existing as StoredSub
    await env.SUBS.put(
      key,
      JSON.stringify({ ...record, schedule: cleanSchedule(payload.schedule), updatedAt: Date.now() }),
    )
    return json({ ok: true }, env)
  }

  if (url.pathname === '/unsubscribe') {
    const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint : ''
    if (!endpoint) return json({ error: 'endpoint が要ります' }, env, 400)
    await env.SUBS.delete(await keyFor(endpoint))
    return json({ ok: true }, env)
  }

  return json({ error: 'そんな道はありません' }, env, 404)
}

/** 1 分ごとに呼ばれ、時刻が来た分だけ送る */
async function tick(env: Env): Promise<void> {
  const now = Date.now()
  const vapid = {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT || 'mailto:noreply@example.com',
  }

  let cursor: string | undefined
  do {
    const page = await env.SUBS.list({ prefix: 'sub:', cursor })
    cursor = page.list_complete ? undefined : page.cursor

    for (const entry of page.keys) {
      const record = (await env.SUBS.get(entry.name, 'json')) as StoredSub | null
      if (!record) continue

      const due = record.schedule.filter((e) => e.at <= now && e.at > now - GRACE_MS)
      const stale = record.schedule.filter((e) => e.at <= now - GRACE_MS)
      const rest = record.schedule.filter((e) => e.at > now)

      let gone = false
      for (const e of due) {
        const res = await sendPush(record.subscription, { title: e.title, body: e.body, tag: e.id }, vapid)
        if (res.gone) {
          gone = true
          break
        }
      }

      if (gone) {
        await env.SUBS.delete(entry.name)
        continue
      }
      if (due.length > 0 || stale.length > 0) {
        await env.SUBS.put(entry.name, JSON.stringify({ ...record, schedule: rest }))
      }
    }
  } while (cursor)
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
  scheduled: (_event: ScheduledController, env: Env, ctx: ExecutionContext) => {
    ctx.waitUntil(tick(env))
  },
}
