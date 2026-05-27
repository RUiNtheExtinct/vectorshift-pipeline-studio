import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,background-color,box-shadow]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-100 text-brand-800',
        secondary:
          'border-transparent bg-slate-100 text-slate-700',
        success:
          'border-transparent bg-emerald-100 text-emerald-700',
        destructive:
          'border-transparent bg-red-100 text-red-700',
        outline: 'text-ink border-slate-200 bg-white',
        mono: 'font-mono border-slate-200 bg-slate-50 text-slate-700',
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
