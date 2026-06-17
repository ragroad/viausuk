import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

export default function Topbar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5EDEB] h-[54px] flex items-center justify-between px-4 md:px-6 gap-3">
      {/* Desktop search */}
      <div className="hidden md:flex items-center gap-2 bg-[#F7FAFA] border border-[#E5EDEB] rounded-lg px-3 py-1.5 flex-1 max-w-xs">
        <span className="text-[#9CA3AF] text-sm">🔍</span>
        <input placeholder="Search VINs, cases, vehicles…" className="bg-transparent text-sm outline-none w-full text-[#0B1B18] placeholder:text-[#9CA3AF]" />
      </div>

      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <span className="text-[18px] font-black text-[#00C795] tracking-tight">VIA</span>
        {user && <span className="text-xs text-[#4B6B63]">{user.name}</span>}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Notification bell */}
        <div className="relative cursor-pointer">
          <span className="text-[18px]">🔔</span>
          <div className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] bg-red-500 rounded-full border-2 border-white" />
        </div>

        {/* New inspection */}
        <button onClick={() => navigate('/app/new-inspection')}
          className="flex items-center gap-1.5 bg-[#00C795] text-white text-[13px] font-semibold px-3 py-1.5 rounded-[7px] hover:bg-[#007D5C] transition-colors">
          <span>+</span>
          <span className="hidden md:inline">New Inspection</span>
          <span className="md:hidden">New</span>
        </button>

        {/* Avatar */}
        {user && (
          <div className="hidden md:flex w-8 h-8 rounded-full bg-[#E0FDF6] items-center justify-center text-[11px] font-bold text-[#007D5C]">
            {user.name.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
        )}
      </div>
    </header>
  );
}
