import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import * as React from 'react';

const toneDot = {
  green: 'bg-tone-green',
  violet: 'bg-tone-violet',
  blue: 'bg-tone-blue',
  amber: 'bg-tone-amber',
  red: 'bg-tone-red',
  cyan: 'bg-tone-cyan',
  pink: 'bg-tone-pink',
  slate: 'bg-tone-slate',
  black: 'bg-tone-black',
};

export function DraggableNodeCard({ type, label, description, tone = 'slate' }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType: type }),
    );
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.style.cursor = 'grabbing';
  };

  const onDragEnd = (event) => {
    event.currentTarget.style.cursor = 'grab';
  };

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            role="button"
            tabIndex={0}
            aria-label={`${label}: ${description}`}
            className={cn(
              'group relative grid cursor-grab select-none gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all',
              'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/30 focus-visible:border-brand-500',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  toneDot[tone] ?? toneDot.slate,
                )}
              />
              <span className="text-sm font-semibold text-ink">{label}</span>
            </div>
            <p className="line-clamp-2 text-[11px] leading-snug text-slate-500">
              {description}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={10}>
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
