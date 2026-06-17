import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { clsx } from 'clsx';

const NAV = [
  { group: 'Main', items: [
    { path: 'dashboard',    label: 'Dashboard',   icon: '▦' },
    { path: 'inspections',  label: 'Inspections', icon: '📋' },
    { path: 'cases',        label: 'Cases',       icon: '📁' },
  ]},
  { group: 'AI Engine', items: [
    { path: 'vin',          label: 'VIN Lookup',  icon: '🔍' },
    { path: 'doc-reader',   label: 'Doc Reader',  icon: '📄' },
    { path: 'photo-ai',     label: 'Photo AI',    icon: '📷' },
  ]},
  { group: 'Business', items: [
    { path: 'billing',      label: 'Billing',     icon: '💳' },
    { path: 'integrations', label: 'Integrations',icon: '🔗' },
    { path: 'team',         label: 'Team',        icon: '👥' },
  ]},
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { org }   = useAuthStore();

  const current = location.pathname.split('/app/')[1]?.split('/')[0] || 'dashboard';

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-[220px] bg-[#0B1B18] flex-col z-50">
      <div className="px-4 py-5 border-b border-[#1C3530]">
        <div className="text-[22px] font-black text-[#00C795] tracking-tight">VIA</div>
        <div className="text-[10px] text-[#3D5E56] mt-0.5">by Roadzen</div>
      </div>

      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div className="text-[9px] font-bold tracking-widest uppercase text-[#2E4E46] px-2.5 py-2 mt-2">{group}</div>
            {items.map(({ path, label, icon }) => (
              <button key={path}
                onClick={() => navigate(`/app/${path}`)}
                className={clsx(
                  'flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-[13px] mb-0.5 transition-all border-l-[3px]',
                  current === path
                    ? 'bg-[#1C3530] text-[#00C795] font-semibold border-l-[#00C795]'
                    : 'text-[#4B6B63] hover:bg-[#1C3530] hover:text-[#A7C4BB] border-l-transparent'
                )}>
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1C3530]">
        <div className="bg-[#1C3530] rounded-xl p-3">
          <div className="text-[11px] font-semibold text-[#00C795]">{org?.plan || 'FREE'} Plan</div>
          <div className="text-[10px] text-[#4B6B63] mt-0.5">{org?.inspectionCount || 0} inspections</div>
          <div className="mt-2 h-1 bg-[#0F2920] rounded-full">
            <div className="h-full bg-[#00C795] rounded-full w-[28%]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
