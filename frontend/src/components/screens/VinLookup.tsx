import { useState, useCallback, useRef } from 'react';
import { vinApi } from '../../lib/api';

export default function VinLookup() {
  const [query,  setQuery]  = useState('');
  const [loading,setLoading]= useState(false);
  const [logs,   setLogs]   = useState<{text:string;type:string}[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error,  setError]  = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type='mu') => {
    setLogs(prev => [...prev, {text, type}]);
    setTimeout(() => { if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  };

  const doLookup = useCallback(async () => {
    const vin = query.trim().toUpperCase();
    if (vin.length < 5) return;
    setLoading(true); setLogs([]); setResult(null); setError('');

    addLog(`→ GET /api/v1/vin/${vin}`);
    addLog('· Calling NHTSA vPIC API…', 'mu');
    addLog('· Running Claude VIN intelligence…', 'mu');

    try {
      const { data } = await vinApi.decode(vin);
      addLog('← 200 OK  NHTSA + Claude response received', 'ok');
      addLog(`✓ ${data.recalls?.length || 0} recalls found — Claude intelligence merged`, 'ok');
      setResult(data);
    } catch (err: any) {
      addLog(`✗ ${err.message}`, 'err');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="max-w-3xl fade-up">
      <div className="mb-4">
        <h1 className="text-[18px] font-extrabold">VIN Lookup</h1>
        <p className="text-sm text-[#4B6B63] mt-1">NHTSA · DOT/FMCSA · DVLA · Claude intelligence — live API calls</p>
        <div className="flex gap-2 flex-wrap mt-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E0FDF6] text-[#007D5C]">claude-sonnet-4-6</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E3A8A]">Live API</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151]">NHTSA Free</span>
        </div>
      </div>
      <div className="bg-white border border-[#E5EDEB] rounded-[10px] p-4 mb-3">
        <div className="flex gap-2.5 flex-wrap mb-3">
          <input value={query} onChange={e => setQuery(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter' && doLookup()}
            placeholder="Enter VIN e.g. 1HGBH41JXMN109186" maxLength={17}
            className="flex-1 min-w-[180px] border border-[#E5EDEB] rounded-[7px] px-3.5 py-2.5 font-mono tracking-wider text-sm outline-none focus:border-[#00C795]" />
          <button onClick={doLookup} disabled={loading || query.length < 5}
            className="px-4 py-2.5 bg-[#00C795] text-white text-sm font-semibold rounded-[7px] hover:bg-[#007D5C] disabled:opacity-50">
            {loading ? 'Analysing…' : 'Analyse with Claude'}
          </button>
        </div>
        <div className="flex gap-4 flex-wrap">
          {['NHTSA API','DOT/FMCSA','State DMV','DVLA (UK)','Claude AI'].map(s => (
            <span key={s} className="text-[11px] text-[#4B6B63] flex items-center gap-1"><span className="text-[#00C795]">✓</span>{s}</span>
          ))}
        </div>
      </div>

      {logs.length > 0 && (
        <div ref={logRef} className="bg-[#0B1B18] rounded-[8px] p-3.5 font-mono text-[11px] max-h-36 overflow-y-auto mb-3">
          {logs.map((l,i) => (
            <div key={i} className={`mb-0.5 ${l.type==='ok'?'text-[#4ADE80]':l.type==='err'?'text-[#F87171]':l.type==='warn'?'text-[#FCD34D]':'text-[#6B7280]'}`}>{l.text}</div>
          ))}
        </div>
      )}

      {error && <div className="bg-[#FEF2F2] text-[#991B1B] rounded-[8px] p-3 text-sm mb-3">⚠️ {error}</div>}

      {result && (
        <div className="grid grid-cols-2 gap-3 fade-up">
          <div className="bg-white border border-[#E5EDEB] rounded-[10px] p-4">
            <div className="font-semibold mb-2.5">Vehicle details (NHTSA)</div>
            {result.nhtsa && Object.entries({
              'VIN': result.vin,
              'Make / Model': `${result.nhtsa.make} ${result.nhtsa.model}`,
              'Year': result.nhtsa.year,
              'Body': result.nhtsa.bodyType,
              'Engine': result.nhtsa.engine,
              'Fuel': result.nhtsa.fuelType,
              'Plant': result.nhtsa.plant,
            }).map(([k,v]) => v ? (
              <div key={k} className="flex justify-between text-xs py-1.5 border-b border-[#F7FAFA]">
                <span className="text-[#4B6B63]">{k}</span>
                <span className="font-medium font-mono">{String(v)}</span>
              </div>
            ) : null)}
          </div>
          <div className="space-y-3">
            <div className="bg-white border border-[#E5EDEB] rounded-[10px] p-4">
              <div className="font-semibold mb-2.5">Claude intelligence</div>
              {result.intelligence && [
                ['FMCSA status', result.intelligence.fmcsaStatus, result.intelligence.fmcsaStatus==='Compliant'],
                ['Safety rating', result.intelligence.safetyRating, true],
                ['Open recalls', `${result.intelligence.openRecalls} open`, result.intelligence.openRecalls===0],
                ['Title status', result.intelligence.titleStatus, result.intelligence.titleStatus==='Clean'],
              ].map(([k,v,ok]) => (
                <div key={String(k)} className="flex justify-between text-xs py-1.5 border-b border-[#F7FAFA]">
                  <span className="text-[#4B6B63]">{k}</span>
                  <span className={`font-semibold ${ok ? 'text-[#00C795]' : 'text-[#F59E0B]'}`}>{String(v)}</span>
                </div>
              ))}
            </div>
            {result.intelligence?.inspectionRecommendations?.length > 0 && (
              <div className="bg-white border border-[#E5EDEB] rounded-[10px] p-4">
                <div className="font-semibold mb-2.5 text-sm">Recommendations</div>
                {result.intelligence.inspectionRecommendations.map((r: string) => (
                  <div key={r} className="flex gap-2 text-xs text-[#4B6B63] py-1 border-b border-[#F7FAFA]">
                    <span className="text-[#00C795] flex-shrink-0">→</span>{r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
