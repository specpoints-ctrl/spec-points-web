import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-xl font-semibold tracking-tight ' +
      'transition-all duration-200 ease-out ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
      'min-h-[44px] min-w-[44px] active:scale-[0.97] select-none';

    const variants: Record<string, string> = {
      default:
        'btn-shimmer bg-gradient-to-br from-primary to-primary/82 text-primary-foreground ' +
        'border-t border-white/20 shadow-btn-primary ' +
        'hover:-translate-y-0.5 hover:shadow-btn-hover hover:brightness-108',
      secondary:
        'btn-shimmer bg-gradient-to-br from-[#e8d9c0] to-[#d4c4a8] text-secondary-foreground ' +
        'border border-[#c8b896]/60 shadow-sm ' +
        'hover:-translate-y-0.5 hover:shadow-md hover:brightness-105',
      destructive:
        'bg-destructive text-destructive-foreground shadow-sm ' +
        'hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-md',
      outline:
        'border border-border/70 bg-white/60 backdrop-blur-sm text-foreground ' +
        'hover:border-primary/50 hover:bg-white/80 hover:text-primary hover:shadow-sm',
      ghost:
        'text-foreground hover:bg-muted/70 hover:text-foreground',
    };

    const sizes: Record<string, string> = {
      sm: 'h-9 px-3.5 text-xs gap-1.5',
      md: 'h-11 px-5 text-sm gap-2',
      lg: 'h-12 px-7 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
