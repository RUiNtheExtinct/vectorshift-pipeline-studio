import * as React from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStore } from '@/store';

function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function CanvasToolbar() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const nodeIDs = useStore((s) => s.nodeIDs);
  const replaceGraph = useStore((s) => s.replaceGraph);
  const clearGraph = useStore((s) => s.clearGraph);

  const fileInputRef = React.useRef(null);

  const onExport = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    downloadJSON(`pipeline-${stamp}.json`, {
      version: 1,
      exportedAt: now.toISOString(),
      nodes,
      edges,
      nodeIDs,
    });
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
        throw new Error('File must include `nodes` and `edges` arrays.');
      }
      replaceGraph({
        nodes: payload.nodes,
        edges: payload.edges,
        nodeIDs: payload.nodeIDs ?? {},
      });
    } catch (err) {
      window.alert(`Could not import pipeline:\n${err.message}`);
    } finally {
      event.target.value = '';
    }
  };

  const onClear = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    const ok = window.confirm(
      'Clear the entire canvas? This removes every node and edge.',
    );
    if (ok) clearGraph();
  };

  return (
    <TooltipProvider delayDuration={250}>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-sm backdrop-blur">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onImportFile}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onImportClick} aria-label="Import pipeline">
              <Upload className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Import pipeline (JSON)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onExport} aria-label="Export pipeline" disabled={nodes.length === 0}>
              <Download className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Export pipeline (JSON)</TooltipContent>
        </Tooltip>
        <div className="mx-0.5 h-5 w-px bg-border" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear canvas" disabled={nodes.length === 0 && edges.length === 0}>
              <Trash2 className="size-4 text-red-600 dark:text-red-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Clear canvas</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
