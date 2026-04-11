import * as React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-gray-50 px-4 py-2 text-sm text-foreground',
            'placeholder:text-muted-foreground/50 transition-all duration-200',
            'border-gray-200 focus-visible:outline-none',
            'focus-visible:border-primary focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_hsl(185_73%_26%_/_0.12)]',
            'disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]',
            error && 'border-destructive focus-visible:ring-destructive focus-visible:shadow-[0_0_0_3px_hsl(0_71%_48%_/_0.13)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive mt-1.5 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
