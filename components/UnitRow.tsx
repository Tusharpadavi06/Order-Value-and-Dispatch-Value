
import React from 'react';
import { UnitKey, UnitData } from '../types';

interface UnitRowProps {
  unit: UnitKey;
  data: UnitData;
  onChange: (unit: UnitKey, field: keyof UnitData, value: number) => void;
}

export const UnitRow: React.FC<UnitRowProps> = ({ unit, data, onChange }) => {
  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="py-2 md:py-3 px-3 md:px-8">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-[7px] md:text-[9px] font-black group-hover:bg-[#E11D48] group-hover:text-white transition-colors">
            {unit[0]}
          </div>
          <span className="font-black text-slate-800 text-[9px] md:text-xs tracking-tight whitespace-nowrap">{unit}</span>
        </div>
      </td>
      <td className="py-2 md:py-3 px-1 md:px-8">
        <div className="relative w-full max-w-[160px] mx-auto">
          <span className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-[9px] md:text-xs">₹</span>
          <input
            type="number"
            inputMode="numeric"
            value={data.orderValue || ''}
            onChange={(e) => onChange(unit, 'orderValue', Math.round(parseFloat(e.target.value) || 0))}
            className="w-full pl-5 md:pl-8 pr-2 md:pr-3 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-[10px] md:text-sm focus:ring-2 focus:ring-slate-100 focus:bg-white outline-none transition-all text-right"
            placeholder="0"
          />
        </div>
      </td>
      <td className="py-2 md:py-3 px-1 md:px-8">
        <div className="relative w-full max-w-[160px] mx-auto">
          <span className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-[9px] md:text-xs">₹</span>
          <input
            type="number"
            inputMode="numeric"
            value={data.dispatchValue || ''}
            onChange={(e) => onChange(unit, 'dispatchValue', Math.round(parseFloat(e.target.value) || 0))}
            className="w-full pl-5 md:pl-8 pr-2 md:pr-3 py-1.5 md:py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[#E11D48] text-[10px] md:text-sm focus:ring-2 focus:ring-rose-50 focus:bg-white outline-none transition-all text-right"
            placeholder="0"
          />
        </div>
      </td>
    </tr>
  );
};
