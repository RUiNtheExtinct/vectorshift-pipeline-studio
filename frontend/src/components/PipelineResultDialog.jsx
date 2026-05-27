import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

function StatTile({ label, value, hint, accent }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-slate-50 p-3',
        accent === 'success' && 'border-emerald-200 bg-emerald-50',
        accent === 'danger' && 'border-red-200 bg-red-50',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 font-mono text-2xl font-semibold tabular-nums text-ink',
          accent === 'success' && 'text-emerald-700',
          accent === 'danger' && 'text-red-700',
        )}
      >
        {value}
      </p>
      {hint && (
        <p
          className={cn(
            'mt-0.5 text-[11px] font-medium text-slate-500',
            accent === 'success' && 'text-emerald-700',
            accent === 'danger' && 'text-red-700',
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function PipelineResultDialog() {
  const submission = useStore((s) => s.submission);
  const closeSubmission = useStore((s) => s.closeSubmission);

  const onOpenChange = (open) => {
    if (!open) closeSubmission();
  };

  return (
    <Dialog open={submission.open} onOpenChange={onOpenChange}>
      <DialogContent>
        {submission.status === 'loading' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin text-brand-600" />
                Analyzing pipeline
              </DialogTitle>
              <DialogDescription>
                Sending nodes and edges to the backend for DAG analysis.
              </DialogDescription>
            </DialogHeader>
          </>
        )}

        {submission.status === 'success' && submission.result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {submission.result.is_dag ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="size-5 text-amber-600" />
                )}
                Pipeline analysis
              </DialogTitle>
              <DialogDescription>
                {submission.result.is_dag
                  ? 'This pipeline is a valid directed acyclic graph and ready to run.'
                  : 'This pipeline cannot be executed as-is. See the details below; affected nodes and edges are highlighted on the canvas.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Nodes" value={submission.result.num_nodes} />
              <StatTile label="Edges" value={submission.result.num_edges} />
              <StatTile
                label="DAG"
                value={submission.result.is_dag ? 'Yes' : 'No'}
                hint={submission.result.is_dag ? 'No cycles' : 'Cycle detected'}
                accent={submission.result.is_dag ? 'success' : 'danger'}
              />
            </div>

            {submission.result.is_dag &&
              submission.result.execution_order?.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Execution order
                  </p>
                  <ol className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-700">
                    {submission.result.execution_order.map((id, index) => (
                      <li
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-1.5 py-0.5 shadow-xs"
                      >
                        <span className="font-semibold text-brand-700">
                          {index + 1}
                        </span>
                        <span className="text-slate-700">{id}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

            {!submission.result.is_dag &&
              submission.result.cycle_node_ids?.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">
                    Cycle members
                  </p>
                  <p className="mt-1 font-mono text-[12px]">
                    {submission.result.cycle_node_ids.join(' → ')}
                  </p>
                </div>
              )}

            {submission.result.invalid_edges?.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Invalid edges
                </p>
                <ul className="mt-1 grid gap-1 font-mono text-[12px]">
                  {submission.result.invalid_edges.map((edge) => (
                    <li key={edge.id ?? `${edge.source}->${edge.target}`}>
                      {edge.source} <span aria-hidden>→</span> {edge.target}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button onClick={closeSubmission}>Close</Button>
            </DialogFooter>
          </>
        )}

        {submission.status === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="size-5 text-red-600" />
                Could not analyze pipeline
              </DialogTitle>
              <DialogDescription>
                {submission.error ?? 'Unknown error'}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
              <p className="font-semibold text-ink">Make sure the backend is running:</p>
              <pre className="mt-2 overflow-x-auto rounded bg-ink px-3 py-2 font-mono text-[12px] text-slate-100">
                cd backend{'\n'}uvicorn main:app --reload
              </pre>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeSubmission}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
