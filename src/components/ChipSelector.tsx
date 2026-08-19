import React from 'react';

interface ChipSelectorProps {
  options: string[];
  selectedChips?: string[];
  onChange: (chips: string[]) => void;
  color?: 'blue' | 'amber' | 'purple';
}

export function ChipSelector({ options, selectedChips = [], onChange, color = 'blue' }: ChipSelectorProps) {
  const toggleChip = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = selectedChips || [];
    if (current.includes(opt)) {
      onChange(current.filter(c => c !== opt));
    } else {
      onChange([...current, opt]);
    }
  };

  const activeBg = 
    color === 'amber' 
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10' 
      : color === 'purple'
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/10'
      : 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10';

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-9">
      {options.map((opt, index) => {
        const isSelected = selectedChips.includes(opt);
        const isAfterTimeframe = index === 2; // after '1H' (D, 4H, 1H)
        return (
          <React.Fragment key={opt}>
            <button
              type="button"
              onClick={(e) => toggleChip(opt, e)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-all ${
                isSelected 
                  ? activeBg 
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              {opt}
            </button>
            {isAfterTimeframe && (
              <span className="text-slate-600 mx-1 select-none font-bold">·</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
