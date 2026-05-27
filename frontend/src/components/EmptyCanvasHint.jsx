import * as React from 'react';
import { MousePointerClick } from 'lucide-react';

export function EmptyCanvasHint() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="mx-6 max-w-md rounded-2xl border border-dashed border-line-strong bg-card/70 px-6 py-8 text-center shadow-sm backdrop-blur-sm">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          <MousePointerClick className="size-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">Build your pipeline</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Drag any module from the library on the left onto this canvas to add
          your first node. Connect handles to wire up the flow.
        </p>
      </div>
    </div>
  );
}
