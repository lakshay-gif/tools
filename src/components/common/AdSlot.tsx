import React from 'react';
import { usePlan } from '../../context/PlanContext';
import { Sparkles } from 'lucide-react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'banner';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slotId = 'default-slot',
  format = 'horizontal',
  className = '',
}) => {
  const { isPro, openUpgradeModal } = usePlan();

  // Pro users never see any ads
  if (isPro) {
    return null;
  }

  const heightClasses =
    format === 'rectangle'
      ? 'min-h-[250px] max-w-[300px]'
      : format === 'banner'
      ? 'min-h-[120px] w-full'
      : 'min-h-[90px] w-full';

  return (
    <div
      className={`my-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/60 p-4 transition-all ${heightClasses} ${className} flex flex-col items-center justify-center text-center relative overflow-hidden`}
      aria-label="Advertisement Slot"
    >
      <div className="absolute top-2 right-3 text-[10px] tracking-wider uppercase font-semibold text-slate-500">
        Sponsored / Ad
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5 z-10">
        <p className="text-xs text-slate-400 font-medium">
          Support ToolsHub free client-side tools
        </p>
        <p className="text-[11px] text-slate-500 max-w-md">
          Files are processed 100% on your device. We use non-intrusive ads to fund maintenance.
        </p>
        <button
          onClick={() => openUpgradeModal('Enjoy an ad-free experience with ToolsHub Pro.')}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 transition-colors border border-blue-900/60 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Remove ads with Pro
        </button>
      </div>

      {/* Decorative subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/10 via-transparent to-indigo-950/10 pointer-events-none" />
    </div>
  );
};
