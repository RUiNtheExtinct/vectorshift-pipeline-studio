import * as React from 'react';
import { Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useStore } from '@/store';
import { submitPipeline } from '@/submit';

export function AppHeader() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const submission = useStore((s) => s.submission);
  const startSubmission = useStore((s) => s.startSubmission);
  const setSubmissionSuccess = useStore((s) => s.setSubmissionSuccess);
  const setSubmissionError = useStore((s) => s.setSubmissionError);

  const isSubmitting = submission.status === 'loading';

  const handleSubmit = async () => {
    startSubmission();
    try {
      const result = await submitPipeline({ nodes, edges });
      setSubmissionSuccess(result);
    } catch (err) {
      setSubmissionError(err.message ?? 'Unknown error');
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          className="size-10 shrink-0 rounded-lg shadow-sm"
        />
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400">
            VectorShift Assessment
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">
            Pipeline Studio
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="primary"
          size="default"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              <Play className="size-4" />
              Submit Pipeline
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
