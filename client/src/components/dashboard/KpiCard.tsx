import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  tooltip?: string;
  isCurrency?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  tooltip,
  isCurrency = false,
}) => {
  const formattedValue =
    isCurrency && typeof value === 'number'
      ? `₹${value.toLocaleString('en-IN')}`
      : typeof value === 'number'
      ? value.toLocaleString('en-IN')
      : value;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between group">
      {/* Top: Icon + Tooltip / Trend Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] group-hover:bg-[#E8F8DE] flex items-center justify-center text-[#174D40] transition-colors">
          <Icon size={20} />
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-[#E8F8DE] text-[#174D40]'
                : 'bg-red-50 text-[#F87171]'
            }`}
          >
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {change}
          </span>

          {tooltip && (
            <div className="relative group/tip">
              <Info size={14} className="text-[#929292] hover:text-[#171717] cursor-pointer" />
              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/tip:block bg-[#171717] text-white text-[11px] rounded-lg py-1 px-2.5 shadow-lg whitespace-nowrap z-50">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric Title & Large Value */}
      <div>
        <div className="text-xs font-semibold text-[#929292] uppercase tracking-wider mb-1">
          {title}
        </div>
        <div className="text-2xl font-extrabold text-[#171717] tracking-tight">
          {formattedValue}
        </div>
      </div>
    </div>
  );
};
