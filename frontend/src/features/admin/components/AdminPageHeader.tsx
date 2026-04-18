import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  variant?: 'default' | 'hero';
}

export function AdminPageHeader({ eyebrow, title, description, actions, variant = 'default' }: AdminPageHeaderProps) {
  if (variant === 'hero') {
    return (
      <div className="relative mb-8 overflow-hidden rounded-[32px] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-900/20 sm:px-10 sm:py-12">
        {/* Background Decorative Gradients */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-500/20 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            {eyebrow ? (
              <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300 backdrop-blur-md border border-white/10">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">{title}</h1>
            {description ? (
              <p className="max-w-2xl text-base text-slate-400/90 leading-relaxed font-medium">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-4">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/60 pb-6 mb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 font-bold">{eyebrow}</p> : null}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-slate-500 font-medium">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
