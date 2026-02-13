
import React, { useState, useMemo } from 'react';
import { SubmissionPayload, DashboardFilters, UnitKey, TimeFilter } from '../types';
import { UNITS } from '../constants';

interface DashboardViewProps {
  data: SubmissionPayload[];
  onUpdate: (id: string, payload: SubmissionPayload) => void;
  onRefresh: () => void;
  isSyncing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onRefresh, isSyncing, onUpdate }) => {
  const [filters, setFilters] = useState<DashboardFilters>({ 
    unit: 'ALL', 
    range: 'all',
    selectedDate: new Date().toISOString().split('T')[0],
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear()
  });

  const [editingRecord, setEditingRecord] = useState<SubmissionPayload | null>(null);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    } catch {
      return dateString;
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (filters.range === 'day' && filters.selectedDate) {
      result = result.filter(item => item.date === filters.selectedDate);
    } else if (filters.range === 'month') {
      result = result.filter(item => {
        const d = new Date(item.date);
        return d.getMonth() === filters.selectedMonth && d.getFullYear() === filters.selectedYear;
      });
    } else if (filters.range === 'year') {
      result = result.filter(item => {
        const d = new Date(item.date);
        return d.getFullYear() === filters.selectedYear;
      });
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filters]);

  const stats = useMemo(() => {
    const totals = { order: 0, dispatch: 0 };
    const unitBreakdown = UNITS.reduce((acc, unit) => {
      acc[unit] = { order: 0, dispatch: 0 };
      return acc;
    }, {} as Record<UnitKey, { order: number; dispatch: number }>);

    filteredData.forEach(entry => {
      UNITS.forEach(u => {
        const unitData = entry.units[u] || (entry.units as any)['KNITTING DISPATCH CURCULAR'] || { orderValue: 0, dispatchValue: 0 };
        const order = parseFloat(unitData.orderValue?.toString()) || 0;
        const dispatch = parseFloat(unitData.dispatchValue?.toString()) || 0;
        
        unitBreakdown[u].order += order;
        unitBreakdown[u].dispatch += dispatch;
        totals.order += order;
        totals.dispatch += dispatch;
      });
    });
    return { totals, unitBreakdown };
  }, [filteredData]);

  const handleEditChange = (unit: UnitKey, field: 'orderValue' | 'dispatchValue', value: number) => {
    if (!editingRecord) return;
    const newUnits = { ...editingRecord.units };
    if (!newUnits[unit]) newUnits[unit] = { orderValue: 0, dispatchValue: 0 };
    newUnits[unit] = { ...newUnits[unit], [field]: value };

    const newTotals = UNITS.reduce((acc, u) => {
      const uData = newUnits[u] || { orderValue: 0, dispatchValue: 0 };
      return {
        order: acc.order + (parseFloat(uData.orderValue?.toString()) || 0),
        dispatch: acc.dispatch + (parseFloat(uData.dispatchValue?.toString()) || 0)
      };
    }, { order: 0, dispatch: 0 });

    setEditingRecord({ ...editingRecord, units: newUnits, totalOrder: newTotals.order, totalDispatch: newTotals.dispatch });
  };

  const maxChartValue = Math.max(...UNITS.flatMap(u => [stats.unitBreakdown[u].order, stats.unitBreakdown[u].dispatch]), 1);

  return (
    <div className="space-y-6 md:space-y-10 pb-20 relative animate-fade-in">
      {/* Edit Overlay */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase">Correct Entry Data</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Log Date: {formatDate(editingRecord.date)}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-400">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {UNITS.map(u => {
                  const unitData = editingRecord.units[u] || { orderValue: 0, dispatchValue: 0 };
                  return (
                    <div key={u} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[9px] font-black text-slate-900 uppercase tracking-tight mb-4 truncate" title={u}>{u}</p>
                      <div className="space-y-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-bold">₹</span>
                          <input 
                            type="number" 
                            value={unitData.orderValue || ''}
                            onChange={(e) => handleEditChange(u, 'orderValue', parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[12px] font-bold focus:ring-2 focus:ring-slate-900/5 outline-none"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300 text-[10px] font-bold">₹</span>
                          <input 
                            type="number" 
                            value={unitData.dispatchValue || ''}
                            onChange={(e) => handleEditChange(u, 'dispatchValue', parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[12px] font-bold text-[#E11D48] focus:ring-2 focus:ring-rose-900/5 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-10">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Order</p>
                  <p className="text-2xl font-black text-slate-900">₹{editingRecord.totalOrder.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#E11D48] uppercase tracking-widest mb-1">Total Dispatch</p>
                  <p className="text-2xl font-black text-[#E11D48]">₹{editingRecord.totalDispatch.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setEditingRecord(null)} className="flex-1 md:flex-none px-10 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={() => { onUpdate(editingRecord.id, editingRecord); setEditingRecord(null); }} className="flex-1 md:flex-none px-14 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#E11D48] transition-all shadow-xl">Apply Updates</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel / Filters */}
      <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['all', 'day', 'month', 'year'] as TimeFilter[]).map(r => (
            <button key={r} onClick={() => setFilters({...filters, range: r})} className={`px-4 md:px-6 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${filters.range === r ? 'bg-white text-[#E11D48] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {r}
            </button>
          ))}
        </div>

        {filters.range === 'day' && (
          <input type="date" value={filters.selectedDate} onChange={e => setFilters({...filters, selectedDate: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-[10px] text-slate-900" />
        )}
        {filters.range === 'month' && (
          <div className="flex gap-2">
            <select value={filters.selectedMonth} onChange={e => setFilters({...filters, selectedMonth: parseInt(e.target.value)})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-[10px] text-slate-900 outline-none">
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={filters.selectedYear} onChange={e => setFilters({...filters, selectedYear: parseInt(e.target.value)})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-[10px] text-slate-900 outline-none">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        {filters.range === 'year' && (
          <select value={filters.selectedYear} onChange={e => setFilters({...filters, selectedYear: parseInt(e.target.value)})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-[10px] text-slate-900 outline-none">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        
        <button onClick={onRefresh} className={`ml-auto w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${isSyncing ? 'bg-slate-100' : 'bg-slate-900 text-white hover:bg-[#E11D48]'}`}>
          <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin text-slate-400' : ''}`}></i>
        </button>
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-900"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Order Intake</p>
          <h4 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">₹{stats.totals.order.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#E11D48]"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Dispatch Output</p>
          <h4 className="text-3xl md:text-5xl font-black text-[#E11D48] tracking-tighter">₹{stats.totals.dispatch.toLocaleString()}</h4>
        </div>
      </div>

      {/* Unit KPI Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Unit-Wise Performance Stats</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
          {UNITS.map(u => (
            <div key={u} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-[#E11D48]">
              <p className="text-[9px] font-black text-slate-900 uppercase truncate mb-4" title={u}>{u}</p>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Order</span>
                  <span className="text-[12px] font-black text-slate-900">₹{stats.unitBreakdown[u].order.toLocaleString()}</span>
                </div>
                <div className="flex flex-col pt-2 border-t border-slate-50">
                  <span className="text-[7px] font-black text-[#E11D48] uppercase tracking-tighter">Dispatch</span>
                  <span className="text-[12px] font-black text-[#E11D48]">₹{stats.unitBreakdown[u].dispatch.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart with Vertical Labels & Full Figures */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Comparative Unit Performance</h3>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-900 rounded-sm"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Order</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E11D48] rounded-sm"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Dispatch</span>
            </div>
          </div>
        </div>
        
        <div className="h-[500px] flex items-end gap-3 md:gap-6 overflow-x-auto pb-10 px-4 custom-scrollbar">
          {UNITS.map(u => {
            const unitOrder = stats.unitBreakdown[u].order;
            const unitDispatch = stats.unitBreakdown[u].dispatch;
            const orderH = (unitOrder / maxChartValue) * 350;
            const dispatchH = (unitDispatch / maxChartValue) * 350;

            return (
              <div key={u} className="flex-none w-[110px] flex flex-col items-center group">
                <div className="w-full flex justify-center items-end gap-2 h-[350px] mb-6">
                  {/* Order Bar */}
                  <div style={{ height: `${Math.max(orderH, 15)}px` }} className="w-6 bg-slate-900 rounded-t-md transition-all group-hover:bg-slate-700 relative flex items-center justify-center">
                    {unitOrder > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-blue-400 font-black text-[9px] [writing-mode:vertical-rl] rotate-180 z-20">
                        {unitOrder.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {/* Dispatch Bar */}
                  <div style={{ height: `${Math.max(dispatchH, 15)}px` }} className="w-6 bg-[#E11D48] rounded-t-md transition-all group-hover:bg-rose-500 relative flex items-center justify-center">
                    {unitDispatch > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-blue-200 font-black text-[9px] [writing-mode:vertical-rl] rotate-180 z-20">
                        {unitDispatch.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {/* Vertical Unit Label - UPDATED TO BLUE BOLD */}
                <div className="h-28 flex items-start justify-center pt-2">
                  <p className="text-[11px] font-black text-blue-600 uppercase transform -rotate-90 whitespace-nowrap origin-center tracking-tight w-6 text-center">
                    {u}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Logs Table (Frozen Header/Column) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Full Operational History Logs</h3>
          <span className="text-[10px] font-bold text-slate-400">{filteredData.length} Records Found</span>
        </div>
        
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-auto max-h-[650px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-[60] bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                <tr>
                  <th className="sticky left-0 top-0 z-[70] bg-slate-900 py-6 px-10 text-left border-r border-white/10 shadow-[2px_0_5px_rgba(0,0,0,0.1)] min-w-[150px]">Record Date</th>
                  <th className="py-6 px-8 border-r border-white/10 min-w-[150px] text-right bg-slate-800">Total Order</th>
                  <th className="py-6 px-8 border-r border-white/10 min-w-[150px] text-right bg-[#E11D48]">Total Dispatch</th>
                  {UNITS.map(u => (
                    <th key={u} colSpan={2} className="py-6 px-8 border-r border-white/10 min-w-[280px] text-center bg-slate-800/50">
                      {u}
                    </th>
                  ))}
                  <th className="py-6 px-8 text-center min-w-[100px]">Action</th>
                </tr>
                <tr className="bg-slate-800 text-[8px] sticky top-[68px] z-[60]">
                   <th className="sticky left-0 z-[70] bg-slate-800 border-r border-white/5 shadow-[2px_0_5px_rgba(0,0,0,0.1)] py-2"></th>
                   <th className="border-r border-white/5 text-right font-black">₹ SUM</th>
                   <th className="border-r border-white/5 text-right font-black">₹ SUM</th>
                   {UNITS.map(u => (
                     <React.Fragment key={`${u}-sub`}>
                        <th className="py-2 px-4 border-r border-white/5 text-center text-slate-400 uppercase tracking-tighter">Order</th>
                        <th className="py-2 px-4 border-r border-white/5 text-center text-rose-300 uppercase tracking-tighter">Dispatch</th>
                     </React.Fragment>
                   ))}
                   <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-all group">
                    <td className="sticky left-0 z-50 bg-white group-hover:bg-slate-50 py-5 px-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <span className="font-black text-slate-900 text-sm whitespace-nowrap">{formatDate(entry.date)}</span>
                    </td>
                    <td className="py-5 px-8 border-r border-slate-50 text-right font-black text-slate-900 bg-slate-50/30">₹{entry.totalOrder.toLocaleString()}</td>
                    <td className="py-5 px-8 border-r border-slate-50 text-right font-black text-[#E11D48] bg-rose-50/10">₹{entry.totalDispatch.toLocaleString()}</td>
                    {UNITS.map(u => {
                      const unitData = entry.units[u] || (entry.units as any)['KNITTING DISPATCH CURCULAR'] || { orderValue: 0, dispatchValue: 0 };
                      return (
                        <React.Fragment key={`${entry.id}-${u}`}>
                          <td className="py-5 px-4 border-r border-slate-50 text-right text-[11px] font-bold text-slate-600">
                            {unitData.orderValue.toLocaleString()}
                          </td>
                          <td className="py-5 px-4 border-r border-slate-100 text-right text-[11px] font-bold text-[#E11D48]">
                            {unitData.dispatchValue.toLocaleString()}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="py-5 px-8 text-center">
                      <button 
                        onClick={() => setEditingRecord(entry)}
                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center mx-auto"
                        title="Edit Record"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
