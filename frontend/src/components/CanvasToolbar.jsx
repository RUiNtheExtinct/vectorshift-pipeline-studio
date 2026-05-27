import * as React from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStore } from '@/store';
import {
  buildExportFilename,
  parsePipeline,
  serializePipeline,
} from '@/lib/pipeline-format';

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
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const [importError, setImportError] = React.useState(null);

  const onExport = () => {
    const payload = serializePipeline({ nodes, edges, nodeIDs });
    downloadJSON(buildExportFilename(), payload);
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let parsedJson;
      try {
        parsedJson = JSON.parse(text);
      } catch {
        setImportError({
          fileName: file.name,
          message: 'File is not valid JSON.',
        });
        return;
      }
      const result = parsePipeline(parsedJson);
      if (!result.ok) {
        setImportError({ fileName: file.name, message: result.error });
        return;
      }
      replaceGraph(result.graph);
    } finally {
      event.target.value = '';
    }
  };

  const onClearClick = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    setConfirmClearOpen(true);
  };

  const onConfirmClear = () => {
    clearGraph();
    setConfirmClearOpen(false);
  };

  const canExport = nodes.length > 0;
  const canClear = nodes.length > 0 || edges.length > 0;

  return (
    <>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onImportClick}
                aria-label="Import pipeline"
              >
                <Upload className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Import pipeline (JSON)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                aria-label="Export pipeline"
                disabled={!canExport}
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Export pipeline (JSON)</TooltipContent>
          </Tooltip>
          <div className="mx-0.5 h-5 w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearClick}
                aria-label="Clear canvas"
                disabled={!canClear}
              >
                <Trash2 className="size-4 text-red-600 dark:text-red-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear canvas</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every node and every edge from the current pipeline.
              Anything you have not exported will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={importError != null}
        onOpenChange={(open) => {
          if (!open) setImportError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Could not import pipeline</DialogTitle>
            <DialogDescription>
              {importError?.fileName
                ? `Problem with ${importError.fileName}:`
                : null}
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-lg border border-border bg-muted p-3 text-sm leading-relaxed text-foreground">
            {importError?.message}
          </p>
          <p className="text-xs text-muted-foreground">
            Only files exported from Pipeline Studio (format{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
              pipeline-studio/v1
            </code>
            ) can be imported.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportError(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
