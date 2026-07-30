import { HashRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import SetPasswordPage from './pages/SetPasswordPage';
import SubscriptionPage from './pages/SubscriptionPage';
import AdminPage from './pages/AdminPage';

function ProtectedWorkspace({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <span className="spinner" />
        <p>Opening your workspace...</p>
      </div>
    );
  }
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.onboarding_required || !profile.organization) {
    return <Navigate to="/onboarding" replace />;
  }
  const trialExpired = profile.organization.subscription_status === 'trialing'
    && profile.organization.trial_ends_at
    && new Date(profile.organization.trial_ends_at).getTime() < Date.now();
  if (profile.organization.subscription_status !== 'active'
      && (profile.organization.subscription_status !== 'trialing' || trialExpired)) {
    return <Navigate to="/subscription" replace />;
  }
  return children;
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="app-loading"><span className="spinner" /><p>Opening platform admin...</p></div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (!profile.is_platform_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/admin" element={<ProtectedAdmin><AdminPage /></ProtectedAdmin>} />
          <Route path="/preview" element={<Dashboard />} />
          <Route
            path="/dashboard"
            element={<ProtectedWorkspace><Dashboard /></ProtectedWorkspace>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
