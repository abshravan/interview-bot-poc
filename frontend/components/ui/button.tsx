import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium text-sm tracking-wide',
    'rounded-xl border border-transparent',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-benz-black focus-visible:ring-benz-silver/40',
    'disabled:pointer-events-none disabled:opacity-40',
    'select-none active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        /* Primary — bright chrome fill */
        default: [
          'bg-benz-chrome text-benz-black',
          'hover:bg-white hover:shadow-glow-silver',
        ].join(' '),

        /* Secondary outline */
        outline: [
          'border-benz-border text-benz-silver bg-transparent',
          'hover:bg-benz-surface hover:border-benz-silver/40 hover:text-benz-chrome',
        ].join(' '),

        /* Ghost — minimal */
        ghost: [
          'text-benz-muted bg-transparent',
          'hover:bg-benz-surface2 hover:text-benz-silver',
        ].join(' '),

        /* Gold accent */
        gold: [
          'bg-gold-gradient text-benz-black font-semibold border-transparent',
          'hover:shadow-glow-gold',
        ].join(' '),

        /* Destructive */
        destructive: [
          'bg-red-500/10 text-red-400 border-red-500/25',
          'hover:bg-red-500/20 hover:border-red-400/50',
        ].join(' '),

        /* Text link */
        link: [
          'text-benz-silver underline-offset-4 hover:underline hover:text-benz-chrome',
          'p-0 h-auto rounded-none border-none',
        ].join(' '),
      },
      size: {
        sm:      'h-8 px-4 text-xs rounded-lg',
        default: 'h-10 px-5',
        lg:      'h-12 px-7 text-[0.9375rem]',
        xl:      'h-14 px-9 text-base rounded-2xl',
        icon:    'h-9 w-9 rounded-lg',
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
