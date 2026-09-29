import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Contact from './pages/Contact'
import Login from './pages/AdminDashboard/Login'
import Dashboard from './pages/AdminDashboard/Dashboard'
import AdminBlogDashboard from './pages/AdminDashboard/Blog'
import Announcement from './pages/AdminDashboard/Announcement'
import FloatingChatbot from './components/FloatingChatbot'
import { isAuthenticated } from './api/auth'

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function ChatbotGate() {
  const { pathname } = useLocation()
  const hideChatbot = pathname === '/login' || pathname.startsWith('/admin')
  return hideChatbot ? null : <FloatingChatbot />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth>
              <AdminBlogDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <RequireAuth>
              <Announcement />
            </RequireAuth>
          }
        />
      </Routes>
      <ChatbotGate />
    </BrowserRouter>
  )
}

export default App