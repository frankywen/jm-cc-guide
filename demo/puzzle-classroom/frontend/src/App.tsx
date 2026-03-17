import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useHasHydrated } from './stores/authStore';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentRoom from './pages/StudentRoom';
import TeacherRoom from './pages/TeacherRoom';
import RoomList from './pages/RoomList';

function PrivateRoute({ children, role }: { children: JSX.Element; role?: string }) {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useHasHydrated();

  // Show loading while hydrating from localStorage
  if (!hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/rooms'} />;
  return children;
}

function App() {
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
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;