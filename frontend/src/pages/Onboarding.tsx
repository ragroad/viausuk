import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { api } from '../lib/api';

const STEPS = ['Company', 'Use case', 'Billing', 'Team', 'Launch'];
const USE_CASES = [
  { id:'PRE_PURCHASE',    icon:'🔍', name:'Pre-purchase',   desc:'Buyer inspections' },
  { id:'INSURANCE_CLAIM', icon:'🛡', name:'Insurance claims',desc:'Damage assessment' },
  { id:'FLEET_SAFETY',    icon:'⚡', name:'Fleet safety',    desc:'Compliance checks' },
  { id:'DEALER_TRADE_IN', icon:'🏪', name:'Dealer trade-in', desc:'Retail valuations' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step,    setStep]    = useState(0);
  const [company, setCompany] = useState('');
  const [market,  setMarket]  = useState('US');
  const [fleet,   setFleet]   = useState('51-200 vehicles');
  const [useCase, setUseCase] = useState('');
  const [saving,  setSaving]  = useState(false);

  const next = async () => {
    if (step < 4) { setStep(s => s + 1); return; }
    // Final step — save org setup and go to app
    setSaving(true);
    try {
      await api.post('/organisations/setup', { name: company, market, useCase, fleetSize: fleet });
    } catch {}
    navigate('/app/dashboard');
    setSaving(false);
  };

  const StepDot = ({ i }: { i: number }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
      <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all
          ${i < step ? 'bg-[#00C795] text-white' : i === step ? 'bg-[#E0FDF6] border-2 border-[#00C795] text-[#007D5C]' : 'border-2 border-[#E5EDEB] text-[#9CA3AF]'}`}>
          {i < step ? '✓' : i + 1}
        </div>
        {i < STEPS.length-1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-[#00C795]' : 'bg-[#E5EDEB]'}`} />}
      </div>
      <div className={`text-[9px] mt-1 whitespace-nowrap ${i === step ? 'text-[#00C795] font-bold' : 'text-[#9CA3AF]'}`}>{STEPS[i]}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7FAFA] flex flex-col">
      <header className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#E5EDEB]">
        <span className="text-[19px] font-black text-[#00C795] tracking-tight">VIA</span>
        <span className="text-sm text-[#4B6B63]">Step {step + 1} of {STEPS.length}</span>
      </header>
      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <div className="bg-white border border-[#E5EDEB] rounded-2xl w-full max-w-lg p-6">
          {/* Stepper */}
          <div className="flex items-start mb-6">{STEPS.map((_, i) => <StepDot key={i} i={i} />)}</div>

          {step === 0 && (
            <div>
              <div className="text-[19px] font-bold mb-1">Tell us about your organisation</div>
              <div className="text-sm text-[#4B6B63] mb-5">Hi {user?.name?.split(' ')[0] || 'there'}! Let's personalise VIA for you.</div>
              <div className="mb-3.5"><label className="block text-xs font-semibold text-[#4B6B63] mb-1.5">Company name</label><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="ABC Fleet Management" className="w-full border border-[#E5EDEB] rounded-[7px] px-3.5 py-2.5 text-sm outline-none focus:border-[#00C795]" /></div>
              <div className="mb-3.5"><label className="block text-xs font-semibold text-[#4B6B63] mb-1.5">Market</label>
                <select value={market} onChange={e=>setMarket(e.target.value)} className="w-full border border-[#E5EDEB] rounded-[7px] px-3.5 py-2.5 text-sm outline-none focus:border-[#00C795] cursor-pointer">
                  <option value="US">🇺🇸 United States</option>
                  <option value="UK">🇬🇧 United Kingdom</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-[#4B6B63] mb-1.5">Fleet size</label>
                <select value={fleet} onChange={e=>setFleet(e.target.value)} className="w-full border border-[#E5EDEB] rounded-[7px] px-3.5 py-2.5 text-sm outline-none focus:border-[#00C795] cursor-pointer">
                  {['1-10 vehicles','11-50 vehicles','51-200 vehicles','200+ vehicles'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-[19px] font-bold mb-1">What will you use VIA for?</div>
              <div className="text-sm text-[#4B6B63] mb-5">We'll pre-load the right inspection templates.</div>
              <div className="grid grid-cols-2 gap-2.5">
                {USE_CASES.map(u => (
                  <div key={u.id} onClick={() => setUseCase(u.id)}
                    className={`border-2 rounded-[10px] p-3.5 cursor-pointer text-center transition-all
                      ${useCase === u.id ? 'border-[#00C795] bg-[#E0FDF6]' : 'border-[#E5EDEB] bg-white hover:border-[#00C795]'}`}>
                    <div className="text-xl mb-1.5">{u.icon}</div>
                    <div className={`text-sm font-semibold ${useCase === u.id ? 'text-[#007D5C]' : 'text-[#0B1B18]'}`}>{u.name}</div>
                    <div className="text-xs text-[#4B6B63] mt-0.5">{u.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-[19px] font-bold mb-1">Secure your account</div>
              <div className="text-sm text-[#4B6B63] mb-4">Required to activate your free plan. You won't be charged unless you upgrade.</div>
              <div className="bg-[#E0FDF6] border-l-4 border-[#00C795] rounded-r-lg p-3.5 mb-4">
                <div className="text-xs font-bold text-[#007D5C] mb-1">Why is a card required on the free plan?</div>
                <p className="text-xs text-[#007D5C] leading-relaxed">Prevents abuse. Stripe holds a $0 authorisation only — no charge is ever made until you upgrade.</p>
              </div>
              <div className="bg-gray-50 border border-[#E5EDEB] rounded-[7px] p-3.5 mb-3">
                <div className="text-[11px] text-[#9CA3AF] mb-2">CARD NUMBER</div>
                <div className="font-mono tracking-widest text-sm mb-3">•••• •••• •••• 4242</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-[11px] text-[#9CA3AF] mb-1">EXPIRY</div><div className="font-mono text-sm tracking-wider">04 / 28</div></div>
                  <div><div className="text-[11px] text-[#9CA3AF] mb-1">CVV</div><div className="font-mono text-sm">•••</div></div>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap text-xs text-[#4B6B63]">
                <span>🔒 256-bit SSL</span><span>Powered by Stripe</span><span>PCI DSS compliant</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-[19px] font-bold">Invite your team</div>
                <button onClick={next} className="text-sm text-[#00C795] font-semibold">Skip →</button>
              </div>
              <div className="text-sm text-[#4B6B63] mb-5">Add inspectors and viewers — or do it later.</div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[#4B6B63] mb-1.5">Email address</label>
                <div className="flex gap-2">
                  <input placeholder="colleague@company.com" className="flex-1 border border-[#E5EDEB] rounded-[7px] px-3.5 py-2.5 text-sm outline-none focus:border-[#00C795]" />
                  <button className="px-3.5 py-2.5 bg-[#00C795] text-white text-sm font-semibold rounded-[7px]">Add</button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-2">
              <div className="text-5xl mb-4">🎉</div>
              <div className="text-[22px] font-bold mb-2">You're all set!</div>
              <div className="text-sm text-[#4B6B63] mb-6 leading-relaxed">Your VIA account is active. Run your first inspection in under 5 minutes.</div>
              <div className="space-y-2 text-left">
                {[['Run your first inspection','→ New inspection wizard'],['Try the VIN Lookup','→ Watch NHTSA + Claude APIs fire'],['Test Document AI','→ Upload a DL and see Claude extract it']].map(([t,s],i) => (
                  <div key={t} className="flex items-center gap-3 p-3.5 bg-[#F7FAFA] border border-[#E5EDEB] rounded-[10px] cursor-pointer hover:border-[#00C795] hover:bg-[#E0FDF6]">
                    <div className="w-6 h-6 rounded-full bg-[#00C795] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</div>
                    <div><div className="text-sm font-semibold">{t}</div><div className="text-xs text-[#4B6B63]">{s}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between mt-5 pt-4.5 border-t border-[#E5EDEB]">
            <button onClick={() => step > 0 && setStep(s => s - 1)} className={`text-sm text-[#4B6B63] font-medium ${step === 0 ? 'invisible' : ''}`}>← Back</button>
            {step < 4
              ? <button onClick={next} className="px-5 py-2 bg-[#00C795] text-white text-sm font-semibold rounded-[7px] hover:bg-[#007D5C]">Continue →</button>
              : <button onClick={next} disabled={saving} className="px-5 py-2 bg-[#00C795] text-white text-sm font-semibold rounded-[7px] hover:bg-[#007D5C] disabled:opacity-50">
                  {saving ? 'Setting up…' : 'Go to dashboard →'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
