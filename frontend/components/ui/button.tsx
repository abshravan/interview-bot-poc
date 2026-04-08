import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium tracking-widest uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-benz-silver/50 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-benz-chrome text-benz-black hover:bg-white hover:shadow-silver-glow active:scale-[0.98]',
        ghost:
          'text-benz-silver hover:text-benz-chrome hover:bg-benz-surface2 border border-benz-border hover:border-benz-silver/40',
        outline:
          'border border-benz-silver/50 text-benz-chrome bg-transparent hover:bg-benz-silver/10 hover:border-benz-silver hover:shadow-silver-glow',
        gold:
          'bg-gold-gradient text-benz-black font-semibold hover:shadow-gold-glow active:scale-[0.98]',
        destructive:
          'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-400',
        link:
          'text-benz-silver underline-offset-4 hover:underline hover:text-benz-chrome p-0 h-auto tracking-normal uppercase-none',
      },
      size: {
        default: 'h-11 px-8 py-2',
        sm:      'h-8 px-4 text-xs',
        lg:      'h-14 px-10 text-base',
        xl:      'h-16 px-12 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
