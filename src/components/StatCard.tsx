import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  trendText?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
}

export function StatCard({ 
  title, 
  value, 
  trend, 
  trendText = "vs last month", 
  icon: Icon,
  iconColorClass = "text-indigo-600",
  iconBgClass = "bg-indigo-50"
}: StatCardProps) {
  const isPositive = trend > 0;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="font-sans text-3xl font-semibold tracking-tight text-gray-900">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", iconBgClass)}>
          <Icon className={cn("w-6 h-6", iconColorClass)} />
        </div>
      </div>
      
      <div className="mt-4 flex items-center text-sm">
        <span className={cn(
          "font-medium px-2 py-0.5 rounded-full",
          isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
        )}>
          {isPositive ? '+' : ''}{trend}%
        </span>
        <span className="text-gray-400 ml-2">{trendText}</span>
      </div>
    </div>
  );
}
