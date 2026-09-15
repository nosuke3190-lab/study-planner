import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startCapturing } from './lib/installPrompt'

// Chrome の合図は読み込み中に来るので、何よりも先に待ち構える
startCapturing()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// オフラインで開けるように、また Web Push を受け取れるように登録する
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(() => {
      // 登録できなくてもアプリ自体は動く
    })
  })
}
