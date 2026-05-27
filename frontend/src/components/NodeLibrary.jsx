import * as React from 'react';
import { DraggableNodeCard } from './DraggableNodeCard';
import { toolbarNodes } from '@/nodes/nodeDefinitions';

export function NodeLibrary() {
  return (
    <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
          Node library
        </span>
        <h2 className="text-sm font-semibold text-foreground">
          Drag a module onto the canvas
        </h2>
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-2 overflow-y-auto pr-1">
        {toolbarNodes.map((node) => (
          <DraggableNodeCard
            key={node.type}
            type={node.type}
            label={node.label}
            description={node.description}
            tone={node.tone}
          />
        ))}
      </div>
      <div className="mt-auto rounded-lg bg-muted px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Tip: right-click a placed node to rename, duplicate, copy its ID, or
        delete it.
      </div>
    </aside>
  );
}
