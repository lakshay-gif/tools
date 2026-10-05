import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  message?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message = 'Processing in your browser...',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`w-full rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-lg ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <span>{message}</span>
        </div>
        <span className="text-sm font-bold text-blue-400 font-mono">
          {clamped}%
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>

      <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Processing 100% locally. No data leaves your machine.
      </p>
    </div>
  );
};
