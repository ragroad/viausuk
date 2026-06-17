import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon:'🔍', title:'VIN & Plate Lookup',  desc:'NHTSA, DOT/FMCSA, DVLA. Auto-populates recall alerts and compliance status.' },
  { icon:'📄', title:'Document AI',          desc:'Claude reads driver licences and insurance policies directly. Single API call, no Textract needed.' },
  { icon:'📷', title:'Photo AI',             desc:'Claude analyses vehicle photos across 8 zones. Severity scoring, repair estimates, before/after.' },
  { icon:'📊', title:'Branded Reports',      desc:'White-label PDF reports. Share via unique link. Viral watermark on free tier drives PLG.' },
];

const PLANS = [
  { label:'FREE',        price:'$0',    per:'/mo',          feats:['5 inspections/month','Watermarked PDF','Single user'],              cta:'Get started free', featured:false },
  { label:'PAY-PER-USE', price:'$0.49', per:'/inspection',  feats:['No monthly fee','Full report','All AI features'],                  cta:'Start',           featured:false },
  { label:'PRO',         price:'$299',  per:'/mo',          feats:['Unlimited inspections','Priority SLA','API + webhooks','Multi-user'],cta:'Get Pro',        featured:true  },
  { label:'ENTERPRISE',  price:'Custom',per:'',             feats:['Volume pricing','SSO + SAML','Dedicated SLA'],                      cta:'Contact sales',   featured:false },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E5EDEB] flex items-center justify-between px-6 h-15">
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-black text-[#00C795] tracking-tight">VIA</span>
          <span className="text-xs text-[#4B6B63]">by Roadzen</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/auth/sign-in')} className="px-4 py-2 text-sm font-semibold border border-[#E5EDEB] rounded-[7px] hover:bg-[#F7FAFA]">Sign in</button>
          <button onClick={() => navigate('/auth/sign-up')} className="px-4 py-2 text-sm font-semibold bg-[#00C795] text-white rounded-[7px] hover:bg-[#007D5C]">Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#E0FDF6] text-[#007D5C] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          ✓ US & UK Markets · Zero human intervention at steady state
        </div>
        <h1 className="text-5xl font-black text-[#0B1B18] leading-tight tracking-tight mb-5">
          Vehicle Inspection,<br /><span className="text-[#00C795]">Fully Automated</span>
        </h1>
        <p className="text-lg text-[#4B6B63] max-w-xl mx-auto mb-8 leading-relaxed">
          AI-powered SaaS for insurers, fleet operators & dealerships. VIN lookup, document AI, photo damage detection — in under 5 minutes.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate('/auth/sign-up')} className="px-7 py-3.5 text-[15px] font-semibold bg-[#00C795] text-white rounded-[10px] hover:bg-[#007D5C]">Start for free — no credit card</button>
          <button className="px-7 py-3.5 text-[15px] font-semibold bg-[#0B1B18] text-white rounded-[10px] hover:bg-[#1C3530]">Book a demo</button>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-14">
          {[['5 min','Sign-up to first inspection'],['98%','AI extraction accuracy'],['0','Humans at steady state']].map(([v,l]) => (
            <div key={l} className="bg-[#F7FAFA] border border-[#E5EDEB] rounded-[10px] p-4 text-center">
              <div className="text-2xl font-black text-[#00C795]">{v}</div>
              <div className="text-xs text-[#4B6B63] mt-1 leading-tight">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F7FAFA] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Everything built in</h2>
          <p className="text-center text-[#4B6B63] text-sm mb-10">Acquisition to report delivery — fully automated</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white border border-[#E5EDEB] rounded-2xl p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="font-bold mb-2 text-sm">{f.title}</div>
                <div className="text-xs text-[#4B6B63] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-3">Simple pricing</h2>
        <p className="text-center text-[#4B6B63] text-sm mb-10">Start free. Scale as you grow.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PLANS.map(p => (
            <div key={p.label} className={`border-2 ${p.featured ? 'border-[#00C795] bg-[#E0FDF6]' : 'border-[#E5EDEB]'} rounded-2xl p-4 relative`}>
              {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00C795] text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">Most popular</div>}
              <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mb-3 ${p.featured ? 'bg-[#E0FDF6] text-[#007D5C] mt-2' : 'bg-[#F3F4F6] text-[#374151]'}`}>{p.label}</div>
              <div className={`text-xl font-black ${p.featured ? 'text-[#00C795]' : 'text-[#0B1B18]'}`}>{p.price}</div>
              <div className="text-xs text-[#4B6B63] mb-3">{p.per || 'contact'}</div>
              {p.feats.map(f => <div key={f} className="flex items-center gap-1 text-xs text-[#4B6B63] mb-1"><span className="text-[#00C795]">✓</span>{f}</div>)}
              <button onClick={() => navigate('/auth/sign-up')} className={`w-full mt-3 py-2 text-xs font-semibold rounded-[7px] ${p.featured ? 'bg-[#00C795] text-white' : 'border border-[#E5EDEB] bg-white'}`}>{p.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1B18] py-10 px-6 text-center">
        <div className="text-2xl font-black text-[#00C795] tracking-tight mb-2">VIA</div>
        <div className="text-xs text-[#4B6B63] mb-6">by Roadzen Technologies · US & UK Markets</div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/auth/sign-up')} className="px-5 py-2.5 bg-[#00C795] text-white text-sm font-semibold rounded-[7px]">Get started free</button>
          <button onClick={() => navigate('/auth/sign-in')} className="px-5 py-2.5 bg-[#1C3530] text-white text-sm font-semibold rounded-[7px]">Sign in</button>
        </div>
      </footer>
    </div>
  );
}
