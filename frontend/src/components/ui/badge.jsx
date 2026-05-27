import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,background-color,box-shadow]',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200',
        secondary:
          'border-transparent bg-muted text-muted-foreground',
        success:
          'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        destructive:
          'border-transparent bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
        outline: 'text-foreground border-border bg-card',
        mono: 'font-mono border-border bg-muted text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
