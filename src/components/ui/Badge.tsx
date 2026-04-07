import * as React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', dot = true, ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        'bg-primary/12 text-primary border border-primary/25',
      secondary:
        'bg-secondary/60 text-secondary-foreground border border-secondary/50',
      destructive:
        'bg-red-50 text-red-700 border border-red-200/80',
      outline:
        'border border-border bg-white/60 text-foreground backdrop-blur-sm',
      success:
        'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      warning:
        'bg-amber-50 text-amber-700 border border-amber-200/80',
    };

    const dotColors: Record<string, string> = {
      default:     'bg-primary',
      secondary:   'bg-secondary-foreground',
      destructive: 'bg-red-500',
      outline:     'bg-muted-foreground',
      success:     'bg-emerald-500',
      warning:     'bg-amber-500',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
          'text-[11px] font-bold tracking-widest uppercase transition-colors',
          variants[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn('block w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
        )}
        {props.children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
