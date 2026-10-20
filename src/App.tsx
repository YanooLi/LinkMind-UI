import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LinkDetailPage } from '@/pages/LinkDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { loadMe } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store'

export default function App() {
  const { token, user } = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()
  useEffect(() => { if (token && !user) dispatch(loadMe()) }, [token, user, dispatch])

  return (
    <BrowserRouter>
      <Routes>
        {!token ? (
          <Route path="*" element={<LoginPage />} />
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/links/:id" element={<LinkDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}
