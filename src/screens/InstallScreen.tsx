import { Check, ChevronLeft, Lock, Plus, Share } from 'lucide-react'
import type { ReactNode } from 'react'
import { BigButton, Card } from '../components/ui'
import { useInstall } from '../hooks/useInstall'
import AppMark from '../components/AppMark'

function Step({ n, text, icon }: { n: number; text: string; icon: ReactNode }) {
  return (
    <li className="flex items-center gap-3.5">
      <span className="num flex size-[26px] shrink-0 items-center justify-center rounded-full bg-ink text-xs font-medium text-inverse">
        {n}
      </span>
      <span className="flex-1 text-sm leading-snug">{text}</span>
      <span className="shrink-0 text-ink2">{icon}</span>
    </li>
  )
}

export default function InstallScreen({
  onBack,
  onDone,
}: {
  onBack: () => void
  onDone: () => void
}) {
  const { canPrompt, install, installed, needsManualSteps } = useInstall()

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-4.5 pb-4 pt-1">
      <header className="-ml-3 flex h-13 items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={onBack} aria-label="戻る" className="flex size-11 items-center justify-center">
            <ChevronLeft size={21} strokeWidth={1.8} />
          </button>
          <h1 className="text-[17px] font-bold">ホーム画面に追加</h1>
        </div>
        <button type="button" onClick={onDone} className="text-[12.5px] font-medium text-ink3">
          あとで
        </button>
      </header>

      <div className="mt-4 flex flex-col items-center">
        <AppMark size={104} className="rounded-[26px] shadow-lg" />
        <h2 className="mt-5 text-xl font-bold">
          {installed ? 'もう追加できています' : 'ホーム画面に追加する'}
        </h2>
        <p className="mt-2 max-w-[270px] text-center text-[13px] leading-relaxed text-ink2">
          {installed
            ? 'アイコンから開くと、ブラウザの枠なしで立ち上がります。'
            : '追加しておくと、ブラウザの枠なしで開けて、電波がなくても立ち上がります。'}
        </p>
      </div>

      {!installed && needsManualSteps && (
        <Card className="mt-5 flex flex-col gap-4 p-4">
          <ol className="flex list-none flex-col gap-4 p-0">
            <Step n={1} text="画面の下にある共有ボタンを押す" icon={<Share size={20} strokeWidth={1.6} />} />
            <Step n={2} text="メニューから「ホーム画面に追加」を選ぶ" icon={<Plus size={20} strokeWidth={1.6} />} />
            <Step n={3} text="右上の「追加」を押す" icon={<Check size={20} strokeWidth={2} />} />
          </ol>
        </Card>
      )}

      {!installed && canPrompt && (
        <BigButton onClick={() => void install()} className="mt-5">
          ホーム画面に追加する
        </BigButton>
      )}

      <Card className="mt-3 flex items-center gap-3 p-3.5">
        <Lock size={18} strokeWidth={1.6} className="shrink-0 text-ink2" />
        <p className="flex-1 text-xs leading-relaxed text-ink2">
          データはこの端末の中だけに保存されます。追加してもどこかに送られることはありません。
        </p>
      </Card>

      <BigButton onClick={onDone} className="mt-auto">
        {installed ? '使いはじめる' : '追加した'}
      </BigButton>
    </div>
  )
}
