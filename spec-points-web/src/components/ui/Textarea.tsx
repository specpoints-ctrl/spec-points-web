import * as React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-foreground',
            'placeholder:text-muted-foreground/50 resize-vertical transition-all duration-200',
            'focus-visible:outline-none focus-visible:border-primary focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_hsl(185_73%_26%_/_0.12)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
