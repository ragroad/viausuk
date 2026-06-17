import { SignIn, SignUp } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage() {
  const location = useLocation();
  const isSignUp = location.pathname.includes('sign-up');

  return (
    <div className="min-h-screen bg-[#F7FAFA] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-[26px] font-black text-[#00C795] tracking-tight">VIA</div>
            <div className="text-xs text-[#4B6B63]">by Roadzen Technologies</div>
          </div>
          {isSignUp ? (
            <SignIn
              afterSignInUrl="/app/dashboard"
              signUpUrl="/auth/sign-up"
              appearance={{ elements: { card: 'shadow-none border border-[#E5EDEB] rounded-2xl' } }}
            />
          ) : (
            <SignIn
              afterSignInUrl="/app/dashboard"
              signUpUrl="/auth/sign-up"
              appearance={{ elements: { card: 'shadow-none border border-[#E5EDEB] rounded-2xl' } }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
