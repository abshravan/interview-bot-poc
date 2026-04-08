import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-sm border border-benz-border bg-benz-surface2',
          'px-4 py-2 text-sm text-benz-chrome placeholder:text-benz-muted',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:border-benz-silver/60 focus-visible:bg-benz-surface focus-visible:shadow-silver-glow',
          'disabled:cursor-not-allowed disabled:opacity-50',
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
