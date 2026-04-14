import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Raffles from './pages/Raffles';
import Tickets from './pages/Tickets';
import Purchases from './pages/Purchases';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Associations from './pages/Associations';
import Layout from './components/Layout';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ConfirmProvider>
      <BrowserRouter basename="/admin">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { maxWidth: '90vw', borderRadius: '1rem' },
          }}
        />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="raffles" element={<Raffles />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="associations" element={<Associations />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ConfirmProvider>
  );
}

export default App;





