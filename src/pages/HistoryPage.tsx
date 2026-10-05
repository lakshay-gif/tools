import React from 'react';
import { HistoryDashboard } from '../components/common/HistoryDashboard';
import { ChevronRight, ShieldCheck } from 'lucide-react';

interface HistoryPageProps {
  onNavigate: (route: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
        <button
          onClick={() => onNavigate('/')}
          className="hover:text-slate-200 transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200 font-medium">Activity History</span>
      </nav>

      {/* Main Container */}
      <HistoryDashboard onNavigate={onNavigate} />
    </div>
  );
};
