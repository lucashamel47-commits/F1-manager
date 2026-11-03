import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PwaStatus from './components/PwaStatus.tsx'
import { initSpotlight } from './lib/spotlight'

initSpotlight()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PwaStatus />
  </StrictMode>,
)
