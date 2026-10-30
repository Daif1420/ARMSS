import React from 'react';
import { BoxStatus, ProjectStatus } from '../../types';

interface BadgeProps {
  status: ProjectStatus | BoxStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'Completed':
      case 'Closed':
        return 'bg-[#34C759]/10 text-[#248A3D] dark:text-[#34C759] border-[#34C759]/20';
      case 'In Progress':
        return 'bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] border-[#007AFF]/20';
      case 'Delivered':
        return 'bg-[#5856D6]/10 text-[#5856D6] dark:text-[#5E5CE6] border-[#5856D6]/20';
      case 'Ready for Delivery':
        return 'bg-[#30B0C7]/10 text-[#1F7A8C] dark:text-[#30B0C7] border-[#30B0C7]/20';
      case 'Pending':
      case 'Open':
        return 'bg-slate-200/60 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300/40 dark:border-slate-700';
      case 'Missing':
        return 'bg-[#FF3B30]/10 text-[#D70015] dark:text-[#FF453A] border-[#FF3B30]/20 font-semibold';
      case 'On Hold':
        return 'bg-[#FF9F0A]/10 text-[#C97800] dark:text-[#FF9F0A] border-[#FF9F0A]/20';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border whitespace-nowrap ${px} ${getStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{status}</span>
    </span>
  );
};
