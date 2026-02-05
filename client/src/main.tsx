import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import {Analytics} from "@vercel/analytics/react"


// Import your publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
      <Analytics />
      <App />
      </BrowserRouter>
  </StrictMode>,
)
