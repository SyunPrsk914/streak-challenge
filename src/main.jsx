import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import Home        from './pages/Home'
import Quiz        from './pages/Quiz'
import Result      from './pages/Result'
import Leaderboard from './pages/Leaderboard'
import Admin       from './pages/Admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/quiz"        element={<Quiz />} />
        <Route path="/result"      element={<Result />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin"       element={<Admin />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
