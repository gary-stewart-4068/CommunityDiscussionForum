import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Forum from './pages/Forum';
import UserManagement from './pages/UserManagement';
import TopicDetail from './pages/TopicDetail';
import CreateTopic from './pages/CreateTopic';
import AdminModeration from './pages/AdminModeration';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Protected routes */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
            <Route path="/topics/:topicId" element={<ProtectedRoute><TopicDetail /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute adminOnly><AdminModeration /></ProtectedRoute>} />
            <Route path="/topics/create" element={<ProtectedRoute><CreateTopic /></ProtectedRoute>} />
            {/* Default route */}
            <Route path="/" element={<Navigate to="/forum" replace />} />
            {/* Unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
