import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

// ⬇⬇⬇ MSW 실행 (development 환경에서만)
async function enableMocking() {
  if (process.env.NODE_ENV === "development") {
    const { worker } = await import("./mocks/browser")
    await worker.start({
      onUnhandledRequest: "bypass", // 경고 줄이고 실 서비스처럼 동작
    })
  }
}

enableMocking() // MSW 비동기 실행
// ⬆⬆⬆

// Render
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
