import { useState, type ReactNode } from 'react'
import {
  Check,
  ChevronLeft,
  Copy,
  EllipsisVertical,
  Lock,
  Plus,
  Share,
  TriangleAlert,
} from 'lucide-react'
import { BigButton, Card, Pill } from '../components/ui'
import { useInstall } from '../hooks/useInstall'
import type { Shell } from '../lib/browser'
import AppMark from '../components/AppMark'

function Step({ n, text, icon }: { n: number; text: ReactNode; icon?: ReactNode }) {
  return (
    <li className="flex items-center gap-3.5">
      <span className="num flex size-[26px] shrink-0 items-center justify-center rounded-full bg-ink text-xs font-medium text-inverse">
        {n}
      </span>
      <span className="flex-1 text-sm leading-snug">{text}</span>
      {icon && <span className="shrink-0 text-ink2">{icon}</span>}
    </li>
  )
}

function Steps({ children }: { children: ReactNode }) {
  return (
    <Card className="p-4">
      <ol className="flex list-none flex-col gap-4 p-0">{children}</ol>
    </Card>
  )
}

const HEADLINE: Record<Shell, string> = {
  installed: 'もう追加できています',
  'ios-safari': 'ホーム画面に追加する',
  'ios-other': 'Safari で開きなおしてください',
  'in-app': 'ふつうのブラウザで開きなおしてください',
  'android-chrome': 'ホーム画面に追加する',
  desktop: 'このパソコンにも入れられます',
  unknown: 'ホーム画面に追加する',
}

const LEAD: Record<Shell, string> = {
  installed: 'アイコンから開くと、ブラウザの枠なしで立ち上がります。',
  'ios-safari': '追加しておくと、ブラウザの枠なしで開けて、電波がなくても立ち上がります。',
  'ios-other':
    'iPhone では Safari からしかホーム画面に追加できません。いま開いているブラウザで追加しても、ただのブックマークになります。',
  'in-app':
    'LINE や X のアプリの中のブラウザからは追加できません。いちど Safari か Chrome で開きなおしてください。',
  'android-chrome': '追加しておくと、ブラウザの枠なしで開けて、電波がなくても立ち上がります。',
  desktop: 'アドレス欄の右にあるインストールのしるしから入れられます。',
  unknown: '追加しておくと、ブラウザの枠なしで開けて、電波がなくても立ち上がります。',
}

export default function InstallScreen({
  onBack,
  onDone,
}: {
  onBack: () => void
  onDone: () => void
}) {
  const { canPrompt, install, installed, shell, readiness } = useInstall()
  const [copied, setCopied] = useState(false)
  const [showWhy, setShowWhy] = useState(false)

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const blocked = shell === 'ios-other' || shell === 'in-app'

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="-ml-3 flex h-13 items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="戻る"
            className="flex size-11 items-center justify-center"
          >
            <ChevronLeft size={21} strokeWidth={1.8} />
          </button>
          <h1 className="text-[17px] font-bold">ホーム画面に追加</h1>
        </div>
        <button type="button" onClick={onDone} className="text-[12.5px] font-medium text-ink3">
          あとで
        </button>
      </header>

      <div className="mt-3 flex flex-col items-center">
        <AppMark size={92} className="rounded-[22px] shadow-lg" />
        <h2 className="mt-4 text-center text-xl font-bold">
          {installed ? HEADLINE.installed : HEADLINE[shell]}
        </h2>
        <p className="mt-2 max-w-[290px] text-center text-[13px] leading-relaxed text-ink2">
          {installed ? LEAD.installed : LEAD[shell]}
        </p>
      </div>

      {!installed && blocked && (
        <Card tone="muted" className="mt-1 flex items-start gap-3 p-3.5">
          <TriangleAlert size={17} className="mt-0.5 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold">いまの画面からは追加できません</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink2">
              下のボタンでこのページのアドレスを写して、
              {shell === 'ios-other' ? 'Safari' : 'Safari か Chrome'}に貼りつけて開いてください。
            </p>
            <Pill onClick={() => void copyUrl()} className="mt-2.5 w-full">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? '写しました' : 'アドレスを写す'}
            </Pill>
          </div>
        </Card>
      )}

      {!installed && shell === 'in-app' && (
        <Steps>
          <Step
            n={1}
            text="画面のすみにある「…」を押す"
            icon={<EllipsisVertical size={20} strokeWidth={1.6} />}
          />
          <Step n={2} text="「Safari で開く」か「ブラウザで開く」を選ぶ" />
          <Step n={3} text="開きなおした画面で、この案内をもう一度見る" />
        </Steps>
      )}

      {!installed && shell === 'ios-safari' && (
        <Steps>
          <Step n={1} text="画面の下にある共有ボタンを押す" icon={<Share size={20} strokeWidth={1.6} />} />
          <Step n={2} text="下に送って「ホーム画面に追加」を選ぶ" icon={<Plus size={20} strokeWidth={1.6} />} />
          <Step n={3} text="右上の「追加」を押す" icon={<Check size={20} strokeWidth={2} />} />
        </Steps>
      )}

      {!installed && shell === 'ios-other' && (
        <Steps>
          <Step n={1} text="アドレスを写す（上のボタン）" icon={<Copy size={20} strokeWidth={1.6} />} />
          <Step n={2} text="Safari を開いてアドレス欄に貼りつける" />
          <Step n={3} text="共有ボタンから「ホーム画面に追加」を選ぶ" icon={<Share size={20} strokeWidth={1.6} />} />
        </Steps>
      )}

      {!installed && shell === 'android-chrome' && !canPrompt && (
        <Steps>
          <Step
            n={1}
            text="右上の「⋮」を押す"
            icon={<EllipsisVertical size={20} strokeWidth={1.6} />}
          />
          <Step n={2} text="「アプリをインストール」か「ホーム画面に追加」を選ぶ" icon={<Plus size={20} strokeWidth={1.6} />} />
          <Step n={3} text="「インストール」を押す" icon={<Check size={20} strokeWidth={2} />} />
        </Steps>
      )}

      {!installed && shell === 'desktop' && !canPrompt && (
        <Steps>
          <Step n={1} text="アドレス欄の右はしにあるインストールのしるしを押す" />
          <Step n={2} text="「インストール」を押す" icon={<Check size={20} strokeWidth={2} />} />
        </Steps>
      )}

      {!installed && canPrompt && (
        <BigButton onClick={() => void install()} className="mt-1">
          <Plus size={19} strokeWidth={2} />
          ホーム画面に追加する
        </BigButton>
      )}

      <Card className="flex items-center gap-3 p-3.5">
        <Lock size={18} strokeWidth={1.6} className="shrink-0 text-ink2" />
        <p className="flex-1 text-xs leading-relaxed text-ink2">
          データはこの端末の中だけに保存されます。追加してもどこかに送られることはありません。
        </p>
      </Card>

      <div>
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="px-0.5 text-[11.5px] font-medium text-ink3 underline underline-offset-4"
        >
          うまくいかないときに見るところ
        </button>
        {showWhy && readiness && (
          <Card className="mt-2 p-3.5">
            <dl className="m-0 flex flex-col gap-2 text-[11.5px]">
              {[
                ['安全な通信（https）', readiness.https],
                ['アプリの情報を読み込めた', readiness.manifestOk],
                ['オフライン用の仕組みが動いている', readiness.serviceWorker],
                ['すでにホーム画面から開いている', readiness.standalone],
              ].map(([label, ok]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3">
                  <dt className="text-ink2">{label}</dt>
                  <dd className={`m-0 font-bold ${ok ? 'text-good' : 'text-ink3'}`}>
                    {ok === null ? '—' : ok ? 'はい' : 'いいえ'}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                <dt className="text-ink2">いま開いている場所</dt>
                <dd className="m-0 font-bold">{shell}</dd>
              </div>
            </dl>
            <p className="mt-2.5 break-all text-[10.5px] leading-relaxed text-ink3">
              {readiness.userAgent}
            </p>
          </Card>
        )}
      </div>

      <BigButton onClick={onDone} className="mt-auto">
        {installed ? '使いはじめる' : '追加した'}
      </BigButton>
    </div>
  )
}
