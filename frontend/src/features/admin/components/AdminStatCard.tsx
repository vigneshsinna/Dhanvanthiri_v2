interface AdminStatCardProps {
  label: string;
  value: string | number;
  change?: number | null;
  accent?: 'default' | 'info' | 'success' | 'warning';
}

export function AdminStatCard({
  label,
  value,
  change = null,
  accent = 'default',
}: AdminStatCardProps) {
  const accentClasses = {
    default: 'border-slate-200 bg-white/50 hover:bg-white',
    info: 'border-sky-100 bg-sky-50/40 hover:bg-sky-50/60 text-sky-900',
    success: 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/60 text-emerald-900',
    warning: 'border-amber-100 bg-amber-50/40 hover:bg-amber-50/60 text-amber-900',
  };

  const accentText = {
    default: 'text-slate-500',
    info: 'text-sky-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
  };

  return (
    <div className={`group relative overflow-hidden rounded-[24px] border transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 p-6 ${accentClasses[accent]}`}>
      <div className="relative z-10">
        <p className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-colors ${accentText[accent]}`}>
          {label}
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight text-slate-950 transition-transform duration-300 group-hover:scale-[1.02]">
            {value}
          </p>
          {change !== null ? (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          ) : null}
        </div>
        {change !== null && (
          <p className="mt-2 text-xs font-medium text-slate-400">
            vs previous period
          </p>
        )}
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-slate-100/20 blur-2xl transition-all duration-500 group-hover:bg-slate-200/40" />
    </div>
  );
}
