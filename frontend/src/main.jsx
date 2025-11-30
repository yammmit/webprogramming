import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

// ⬇⬇⬇ MSW 실행 (development 환경에서만, VITE_USE_MOCK='true'일 때만)
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK === 'true' && process.env.NODE_ENV === "development") {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
    });
  }
}

// 기본적으로 mock 비활성화 — 필요하면 VITE_USE_MOCK='true'로 실행하세요
// enableMocking() // MSW 비동기 실행
// ⬆⬆⬆

// Render
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
