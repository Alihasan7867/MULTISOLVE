import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

interface SalesGaugeProps {
  progressPercentage: number;
  monthlySalesGoal: number;
  currentSales: number;
  growthPercentage: number;
  netProfit: number;
  grossRevenue: number;
}

export const SalesGauge: React.FC<SalesGaugeProps> = ({
  progressPercentage,
  monthlySalesGoal,
  currentSales,
  growthPercentage,
  netProfit,
  grossRevenue,
}) => {
  // Semicircular gauge calculation
  // Radius = 80, strokeWidth = 14
  // Circumference for half circle = PI * R ≈ 3.14159 * 80 ≈ 251.3
  const radius = 80;
  const strokeWidth = 14;
  const semiCircumference = Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progressPercentage));
  const strokeDashoffset = semiCircumference - (clampedProgress / 100) * semiCircumference;

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="font-bold text-base text-[#171717]">Sales Overview</h3>
          <p className="text-xs text-[#929292]">Monthly target progress</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F8DE] text-[#174D40] text-xs font-bold">
          <TrendingUp size={13} className="text-[#174D40]" />
          <span>{growthPercentage >= 0 ? `+${growthPercentage}%` : `${growthPercentage}%`}</span>
        </div>
      </div>

      {/* Semicircular SVG Gauge matching reference */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg
          viewBox="0 0 200 115"
          className="w-56 h-32 overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#174D40" />
              <stop offset="100%" stopColor="#98E66B" />
            </linearGradient>
          </defs>
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#F0F0F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={semiCircumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute bottom-2 flex flex-col items-center text-center">
          <span className="text-3xl font-extrabold text-[#171717] tracking-tight">
            {clampedProgress}%
          </span>
          <span className="text-[11px] font-semibold text-[#929292] uppercase tracking-wider">
            Target Achieved
          </span>
        </div>
      </div>

      {/* Target Progress Bar & Numerical stats */}
      <div className="space-y-4 pt-2 border-t border-[#EAEAEA]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#929292] font-medium flex items-center gap-1.5">
            <Target size={14} className="text-[#174D40]" />
            Monthly Goal
          </span>
          <span className="font-bold text-[#171717]">
            ₹{monthlySalesGoal.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-[#F5F5F5] rounded-2xl">
            <div className="text-[11px] text-[#929292] font-medium">Net Profit</div>
            <div className="text-sm font-bold text-[#174D40] mt-0.5">
              ₹{netProfit.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-3 bg-[#F5F5F5] rounded-2xl">
            <div className="text-[11px] text-[#929292] font-medium">Gross Revenue</div>
            <div className="text-sm font-bold text-[#171717] mt-0.5">
              ₹{grossRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
