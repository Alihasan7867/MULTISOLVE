import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';

interface RevenueChartProps {
  totalRevenue: number;
  data: { month: string; revenue: number; expense: number; profit: number }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ totalRevenue, data }) => {
  const [filter, setFilter] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  // Custom rounded tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#171717] text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-white/10">
          <p className="font-bold text-[#98E66B]">{label}</p>
          <p className="flex justify-between gap-4">
            <span className="text-gray-300">Revenue:</span>
            <span className="font-semibold">₹{payload[0]?.value?.toLocaleString('en-IN')}</span>
          </p>
          {payload[1] && (
            <p className="flex justify-between gap-4">
              <span className="text-gray-300">Expenses:</span>
              <span className="font-semibold">₹{payload[1]?.value?.toLocaleString('en-IN')}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft flex flex-col justify-between h-full">
      {/* Header with Title & Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-[#171717]">Revenue Insights</h3>
            <span className="flex items-center text-xs font-bold text-[#174D40] bg-[#E8F8DE] px-2 py-0.5 rounded-full">
              <ArrowUpRight size={13} /> +14.1%
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Daily, Weekly, Monthly Filter tabs */}
        <div className="flex items-center bg-[#F5F5F5] p-1 rounded-xl border border-[#EAEAEA] self-start sm:self-auto">
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                filter === tab
                  ? 'bg-white text-[#171717] shadow-xs'
                  : 'text-[#929292] hover:text-[#171717]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart with rounded forest & lime green bars */}
      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#929292', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#929292', fontSize: 11 }}
              tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v / 1000}k`)}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Primary Forest Green Bar */}
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill="#174D40"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            {/* Lime Green Accent Bar for Net Profit */}
            <Bar
              dataKey="profit"
              name="Net Profit"
              fill="#98E66B"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-[#EAEAEA] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#174D40]"></span>
          <span className="text-[#929292] font-medium">Gross Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#98E66B]"></span>
          <span className="text-[#929292] font-medium">Net Profit</span>
        </div>
      </div>
    </div>
  );
};
