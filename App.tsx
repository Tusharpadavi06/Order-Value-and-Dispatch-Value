
import React, { useState, useMemo, useEffect } from 'react';
import { UNITS, INITIAL_FORM_STATE } from './constants';
import { FormDataState, UnitKey, UnitData, SubmissionPayload } from './types';
import { UnitRow } from './components/UnitRow';
import { DashboardView } from './components/DashboardView';

const SUPABASE_URL = "https://xhwixancggufvekyvyzg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhod2l4YW5jZ2d1ZnZla3l2eXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTcxMjEsImV4cCI6MjA4NjI5MzEyMX0.xbrsZw2JgndRptEN-DaLqbRUs9vU2WpwqvwMJhYdDfw";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyM6m7LOuWzW5qUg8b9ynxP3EzMfE9zrz71eld3-r1U2pROK9-GwZ8sNBQSx-MnDe6/exec"; 

const GinzaLogo = () => (
  <div className="flex items-center justify-center bg-white p-2 rounded-xl shadow-sm border border-slate-100">
    <img 
      src="https://www.ginzalimited.com/cdn/shop/files/Ginza_logo.jpg?v=1668509673&width=500" 
      alt="Ginza Industries Limited" 
      className="h-10 md:h-14 w-auto object-contain"
    />
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_STATE);
  const [currentDate, setCurrentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<SubmissionPayload[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    fetchFromSupabase();
  }, []);

  const fetchFromSupabase = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/operational_logs?select=*&order=entry_date.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (!response.ok) throw new Error(`Cloud Storage Error: ${response.status}`);
      
      const data = await response.json();
      const mappedHistory: SubmissionPayload[] = data.map((item: any) => ({
        id: item.id.toString(),
        date: item.entry_date,
        totalOrder: item.total_order,
        totalDispatch: item.total_dispatch,
        units: item.units_data
      }));
      
      setHistory(mappedHistory);
    } catch (err) {
      console.error("Supabase Fetch Error:", err);
      setSyncError("Cloud Sync Offline");
    } finally {
      setIsSyncing(false);
    }
  };

  const totals = useMemo(() => {
    return UNITS.reduce((acc, unit) => ({
      order: acc.order + (formData[unit]?.orderValue || 0),
      dispatch: acc.dispatch + (formData[unit]?.dispatchValue || 0),
    }), { order: 0, dispatch: 0 });
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totals.order === 0 && totals.dispatch === 0) {
      alert("Input Required: Values cannot be zero.");
      return;
    }

    const existing = history.find(h => h.date === currentDate);
    if (existing) {
      if (confirm(`A record for ${currentDate} already exists. Do you want to update it?`)) {
        await handleUpdate(existing.id, {
          ...existing,
          units: formData,
          totalOrder: totals.order,
          totalDispatch: totals.dispatch
        });
        return;
      } else {
        return;
      }
    }
    
    setIsSubmitting(true);
    const submissionId = Date.now().toString();
    
    const payload = {
      id: submissionId,
      entry_date: currentDate,
      units_data: formData,
      total_order: totals.order,
      total_dispatch: totals.dispatch,
    };

    try {
      // 1. Commit to Supabase
      const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/operational_logs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.text();
        throw new Error(`Supabase Error ${supabaseResponse.status}: ${errorData}`);
      }

      // 2. Background Commit to Google Sheets (Fire and forget, no-cors)
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          id: submissionId,
          date: currentDate,
          units: formData,
          totalOrder: totals.order,
          totalDispatch: totals.dispatch
        })
      }).catch(err => console.error("Google Sheets Background Sync Fail:", err));

      setFormData(INITIAL_FORM_STATE);
      alert("Record successfully committed to the Hub.");
      await fetchFromSupabase();
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Critical Submission Error:", err);
      alert(`Sync Failed: ${err instanceof Error ? err.message : 'Check internet connection.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, updatedPayload: SubmissionPayload) => {
    setIsSubmitting(true);
    
    const payload = {
      entry_date: updatedPayload.date,
      units_data: updatedPayload.units,
      total_order: updatedPayload.totalOrder,
      total_dispatch: updatedPayload.totalDispatch,
    };

    try {
      // 1. Explicit PATCH for Updating existing row in Supabase
      const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/operational_logs?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.text();
        throw new Error(`Update Failed ${supabaseResponse.status}: ${errorData}`);
      }

      // 2. Sync to Google Sheets
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          id: id,
          date: updatedPayload.date,
          units: updatedPayload.units,
          totalOrder: updatedPayload.totalOrder,
          totalDispatch: updatedPayload.totalDispatch
        })
      }).catch(err => console.error("Google Update Background Sync Fail:", err));
      
      alert("Changes saved and synced across all systems.");
      await fetchFromSupabase();
    } catch (err) {
      console.error("Critical Update Error:", err);
      alert(`Update Error: ${err instanceof Error ? err.message : 'Database communication failed.'}`);
      await fetchFromSupabase(); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <div className="max-w-[1700px] mx-auto w-full px-4 md:px-8 pt-6 md:pt-10 flex-1">
        <header className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 mb-8 md:mb-10 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 md:gap-6">
            <GinzaLogo />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                GINZA <span className="text-[#E11D48]">INDUSTRIES</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-rose-500 animate-ping' : syncError ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  {isSyncing ? 'Syncing...' : syncError ? syncError : 'Operational Hub: Online'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 w-full lg:w-auto shadow-inner">
            <button onClick={() => setActiveTab('form')} className={`flex-1 md:flex-none px-6 md:px-12 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'form' ? 'bg-white text-[#E11D48] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              Commit Entry
            </button>
            <button onClick={() => setActiveTab('dashboard')} className={`flex-1 md:flex-none px-6 md:px-12 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#E11D48] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
              Intelligence Hub
              {history.length > 0 && <span className="ml-2 bg-[#E11D48] text-white text-[9px] px-2 py-0.5 rounded-full">{history.length}</span>}
            </button>
          </div>
        </header>

        <main className="animate-fade-in">
          {activeTab === 'form' ? (
            <div className="space-y-6 md:space-y-8 pb-20 max-w-7xl mx-auto">
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-[#E11D48]">
                    <i className="fas fa-calendar-day text-2xl"></i>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Target Date</label>
                    <input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} className="text-2xl md:text-3xl font-black text-slate-900 bg-transparent border-none focus:ring-0 p-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-fixed min-w-[320px]">
                    <thead className="bg-slate-900 text-white">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em]">
                        <th className="py-6 md:py-10 px-6 md:px-12 w-1/4">Business Unit</th>
                        <th className="py-6 md:py-10 px-4 md:px-12 text-center w-3/8">Order Intake (₹)</th>
                        <th className="py-6 md:py-10 px-4 md:px-12 text-center w-3/8">Dispatch Output (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {UNITS.map(unit => (
                        <UnitRow key={unit} unit={unit} data={formData[unit]} onChange={(u, f, v) => setFormData(prev => ({ ...prev, [u]: { ...prev[u], [f]: v } }))} />
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/90">
                      <tr className="font-black">
                        <td className="py-8 md:py-16 px-6 md:px-12 text-slate-400 text-[11px] uppercase tracking-[0.3em]">Aggregate Period Totals</td>
                        <td className="py-8 md:py-16 px-4 md:px-12 text-center text-2xl md:text-5xl tracking-tighter">₹{totals.order.toLocaleString()}</td>
                        <td className="py-8 md:py-16 px-4 md:px-12 text-center text-2xl md:text-5xl text-[#E11D48] tracking-tighter">₹{totals.dispatch.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || (totals.order === 0 && totals.dispatch === 0)} 
                className="w-full py-6 md:py-10 bg-slate-900 text-white font-black text-[12px] uppercase tracking-[0.5em] rounded-[2.5rem] shadow-2xl hover:bg-[#E11D48] transition-all disabled:opacity-30 flex items-center justify-center gap-4"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-sync animate-spin"></i>
                    Syncing Central Cloud...
                  </>
                ) : 'Commit Official Log'}
              </button>
            </div>
          ) : (
            <DashboardView data={history} onUpdate={handleUpdate} onRefresh={fetchFromSupabase} isSyncing={isSyncing} />
          )}
        </main>
      </div>
      <footer className="py-12 text-center">
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.6em]">Ginza Group Centralized Intelligence Engine</p>
      </footer>
    </div>
  );
};

export default App;
