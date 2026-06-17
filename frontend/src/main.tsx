import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function render(children: React.ReactNode) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>{children}</BrowserRouter>
    </React.StrictMode>
  );
}

// If Clerk key is present, wrap with ClerkProvider
// If not (prototype mode), render without auth — works fine for demo
if (CLERK_KEY) {
  import('@clerk/clerk-react').then(({ ClerkProvider }) => {
    render(<ClerkProvider publishableKey={CLERK_KEY}><App /></ClerkProvider>);
  });
} else {
  console.warn('[VIA] VITE_CLERK_PUBLISHABLE_KEY not set — running in prototype mode (no auth)');
  render(<App />);
}
