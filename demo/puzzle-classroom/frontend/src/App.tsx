import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useHasHydrated } from './stores/authStore';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentRoom from './pages/StudentRoom';
import TeacherRoom from './pages/TeacherRoom';
import RoomList from './pages/RoomList';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children, role }: { children: JSX.Element; role?: string }) {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useHasHydrated();

  // Show loading while hydrating from localStorage
  if (!hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    // Redirect based on user role
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'teacher') return <Navigate to="/teacher" />;
    return <Navigate to="/rooms" />;
  }
  return children;
}

function App() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useHasHydrated();

  // Determine home route based on role
  const getHomeRoute = () => {
    if (!hasHydrated || !user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'teacher') return '/teacher';
    return '/rooms';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/teacher"
        element={
          <PrivateRoute role="teacher">
            <TeacherDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/room/:id"
        element={
          <PrivateRoute role="teacher">
            <TeacherRoom />
          </PrivateRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <PrivateRoute>
            <RoomList />
          </PrivateRoute>
        }
      />
      <Route
        path="/room/:id"
        element={
          <PrivateRoute>
            <StudentRoom />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to={getHomeRoute()} />} />
    </Routes>
  );
}

export default App;