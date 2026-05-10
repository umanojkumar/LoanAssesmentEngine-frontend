import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FinancialDataCollectionPage from './pages/FinancialDataCollectionPage';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-shell">Loading session...</div>;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={user ? '/collect' : '/login'} replace />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/collect"
          element={
            <ProtectedRoute>
              <FinancialDataCollectionPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
