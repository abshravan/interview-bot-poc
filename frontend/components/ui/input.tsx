import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl px-4 py-2.5',
          'bg-benz-surface2 border border-benz-border',
          'text-sm text-benz-chrome placeholder:text-benz-muted/60',
          'transition-all duration-200 ease-out',
          'hover:border-benz-border-2',
          'focus:outline-none focus:bg-benz-surface focus:border-benz-silver/40',
          'focus:ring-2 focus:ring-benz-silver/15 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'autofill:bg-benz-surface2',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
