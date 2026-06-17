import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing';
import AuthPage from './pages/Auth';
import OnboardingPage from './pages/Onboarding';
import AppShell from './components/layout/AppShell';

// Clerk is optional — only import hooks if the package is available
let useAuth: () => { isSignedIn?: boolean; isLoaded?: boolean } = () => ({ isSignedIn: true, isLoaded: true });
let useUser: () => { user: any } = () => ({ user: { id: 'demo', fullName: 'Demo User', primaryEmailAddress: { emailAddress: 'demo@via.app' } } });

try {
  const clerk = require('@clerk/clerk-react');
  useAuth = clerk.useAuth;
  useUser = clerk.useUser;
} catch {
  // Clerk not configured — prototype mode, treat everyone as signed in
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  // Prototype mode — isLoaded and isSignedIn both default to true above
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F7FAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00C795] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isSignedIn) return <Navigate to="/auth/sign-in" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<LandingPage />} />
      <Route path="/auth/*"      element={<AuthPage />} />
      <Route path="/onboarding"  element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route path="/app/*"       element={<RequireAuth><AppShell /></RequireAuth>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  );
}
