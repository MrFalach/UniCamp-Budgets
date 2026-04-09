interface EmptyStateProps {
  icon: 'expenses' | 'camps' | 'users' | 'reimbursements' | 'analytics' | 'general'
  title: string
  description?: string
}

function EmptyIllustration({ icon }: { icon: EmptyStateProps['icon'] }) {
  const size = 80
  const svgProps = { width: size, height: size, viewBox: "0 0 80 80", fill: "none", 'aria-hidden': true as const }
  switch (icon) {
    case 'expenses':
      return (
        <svg {...svgProps}>
          <rect x="16" y="12" width="48" height="56" rx="6" className="fill-muted stroke-muted-foreground/20" strokeWidth="1.5" />
          <rect x="24" y="24" width="20" height="3" rx="1.5" className="fill-muted-foreground/30" />
          <rect x="24" y="32" width="32" height="3" rx="1.5" className="fill-muted-foreground/20" />
          <rect x="24" y="40" width="28" height="3" rx="1.5" className="fill-muted-foreground/20" />
          <rect x="24" y="48" width="24" height="3" rx="1.5" className="fill-muted-foreground/20" />
          <circle cx="56" cy="56" r="14" className="fill-primary/10 stroke-primary/40" strokeWidth="1.5" />
          <path d="M50 56h12M56 50v12" className="stroke-primary/60" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'camps':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 14L62 54H18L40 14Z" className="fill-muted stroke-muted-foreground/20" strokeWidth="1.5" />
          <path d="M28 38L42 54H14L28 38Z" className="fill-primary/10 stroke-primary/30" strokeWidth="1.5" />
          <rect x="36" y="44" width="8" height="10" rx="1" className="fill-primary/20" />
          <circle cx="40" cy="26" r="3" className="fill-amber-400/60" />
          <path d="M10 54h60" className="stroke-muted-foreground/20" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'users':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="30" r="12" className="fill-muted stroke-muted-foreground/20" strokeWidth="1.5" />
          <path d="M20 62c0-11.046 8.954-20 20-20s20 8.954 20 20" className="fill-primary/10 stroke-primary/30" strokeWidth="1.5" />
          <circle cx="58" cy="52" r="10" className="fill-muted stroke-muted-foreground/20" strokeWidth="1.5" />
          <path d="M53 52h10M58 47v10" className="stroke-primary/60" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'reimbursements':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="20" width="56" height="40" rx="6" className="fill-muted stroke-muted-foreground/20" strokeWidth="1.5" />
          <circle cx="40" cy="40" r="12" className="fill-primary/10 stroke-primary/30" strokeWidth="1.5" />
          <circle cx="40" cy="40" r="4" className="fill-primary/40" />
          <rect x="12" y="26" width="56" height="6" className="fill-muted-foreground/10" />
        </svg>
      )
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="16" y="16" width="48" height="48" rx="8" className="fill-muted stroke-muted-foreground/20" strokeWidth="1.5" />
          <path d="M32 40h16M40 32v16" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 animate-fade-in">
      <EmptyIllustration icon={icon} />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70">{description}</p>}
    </div>
  )
}
