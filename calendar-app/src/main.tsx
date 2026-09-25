import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SystemBars, SystemBarsStyle } from '@capacitor/core'
import '@fontsource/figtree/500.css'
import '@fontsource/figtree/600.css'
import '@fontsource/figtree/700.css'
import './styles.css'
import App from './App.tsx'
import { isNative } from './lib/notifications'

// 明るい背景なので、ステータスバーの文字・アイコンは濃い色にする
if (isNative) SystemBars.setStyle({ style: SystemBarsStyle.Light }).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
