import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium tracking-widest uppercase transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-benz-surface2 text-benz-silver border border-benz-border',
        silver:   'bg-benz-silver/10 text-benz-chrome border border-benz-silver/30',
        gold:     'bg-benz-gold/10 text-benz-gold-light border border-benz-gold/30',
        success:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        warning:  'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        error:    'bg-red-500/10 text-red-400 border border-red-500/30',
        active:   'bg-benz-chrome text-benz-black font-semibold',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
