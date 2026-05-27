import { AppHeader } from '@/components/AppHeader';
import { NodeLibrary } from '@/components/NodeLibrary';
import { PipelineCanvas } from '@/components/PipelineCanvas';
import { PipelineResultDialog } from '@/components/PipelineResultDialog';
import { RenameDialog } from '@/components/RenameDialog';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-surface-canvas">
        <AppHeader />
        <main className="flex min-h-0 flex-1 gap-4 p-4">
          <NodeLibrary />
          <PipelineCanvas />
        </main>
        <PipelineResultDialog />
        <RenameDialog />
      </div>
    </TooltipProvider>
  );
}
