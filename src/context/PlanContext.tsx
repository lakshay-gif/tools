import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlanType, PlanLimits } from '../types';
import { PLANS_CONFIG, DEFAULT_FREE_LIMITS } from '../config/plans.config';

interface PlanContextValue {
  currentPlan: PlanType;
  isPro: boolean;
  limits: PlanLimits;
  upgradeModalOpen: boolean;
  upgradeReason: string;
  openUpgradeModal: (reason?: string) => void;
  closeUpgradeModal: () => void;
  setPlan: (plan: PlanType) => void;
  activateProForTesting: () => void;
  resetToFree: () => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPlan, setCurrentPlanState] = useState<PlanType>(() => {
    const saved = localStorage.getItem('th_user_plan');
    if (saved && ['free', 'pro_monthly', 'pro_yearly', 'lifetime'].includes(saved)) {
      return saved as PlanType;
    }
    return 'free';
  });

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const setPlan = (plan: PlanType) => {
    setCurrentPlanState(plan);
    localStorage.setItem('th_user_plan', plan);
  };

  const isPro = currentPlan !== 'free';
  const limits = PLANS_CONFIG[currentPlan]?.limits || DEFAULT_FREE_LIMITS;

  const openUpgradeModal = (reason?: string) => {
    setUpgradeReason(reason || 'Upgrade to ToolsHub Pro to unlock unlimited usage and ad-free experience.');
    setUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setUpgradeModalOpen(false);
    setUpgradeReason('');
  };

  const activateProForTesting = () => {
    setPlan('pro_yearly');
    closeUpgradeModal();
  };

  const resetToFree = () => {
    setPlan('free');
  };

  return (
    <PlanContext.Provider
      value={{
        currentPlan,
        isPro,
        limits,
        upgradeModalOpen,
        upgradeReason,
        openUpgradeModal,
        closeUpgradeModal,
        setPlan,
        activateProForTesting,
        resetToFree,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
