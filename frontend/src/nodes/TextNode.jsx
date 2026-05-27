import * as React from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useStore } from '@/store';
import { NodeCard, NodeCardHeader } from './BaseNode';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const reservedWords = new Set([
  'await','break','case','catch','class','const','continue','debugger','default',
  'delete','do','else','enum','export','extends','false','finally','for','function',
  'if','import','in','instanceof','new','null','return','super','switch','this',
  'throw','true','try','typeof','var','void','while','with','yield',
]);

const variablePattern = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

const TEXT_NODE_MIN_WIDTH = 264;
const TEXT_NODE_MAX_WIDTH = 520;
const TEXTAREA_MIN_HEIGHT = 96;
const TEXTAREA_MAX_HEIGHT = 360;

function getTemplateVariables(text) {
  const variables = [];
  const seen = new Set();
  let match;
  while ((match = variablePattern.exec(text)) !== null) {
    const name = match[1];
    if (!reservedWords.has(name) && !seen.has(name)) {
      seen.add(name);
      variables.push(name);
    }
  }
  return variables;
}

function getTextDimensions(text) {
  const lines = text.split('\n');
  const longestLine = lines.reduce((longest, line) => Math.max(longest, line.length), 0);
  const textareaHeight = Math.min(
    TEXTAREA_MAX_HEIGHT,
    Math.max(TEXTAREA_MIN_HEIGHT, lines.length * 22 + 36),
  );
  return {
    width: Math.min(
      TEXT_NODE_MAX_WIDTH,
      Math.max(TEXT_NODE_MIN_WIDTH, longestLine * 8 + 96),
    ),
    textareaHeight,
  };
}

export function TextNode({ id, data }) {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const updateNodeInternals = useUpdateNodeInternals();
  const currText = data?.text ?? '{{ input }}';
  const variables = React.useMemo(() => getTemplateVariables(currText), [currText]);
  const dimensions = React.useMemo(() => getTextDimensions(currText), [currText]);
  const title = data?.displayName || 'Text';

  const handleTextChange = (event) => {
    updateNodeField(id, 'text', event.target.value);
  };

  React.useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, variables]);

  return (
    <NodeCard tone="black" style={{ width: dimensions.width }}>
      {variables.map((variableName, index) => (
        <Handle
          key={variableName}
          type="target"
          position={Position.Left}
          id={`${id}-${variableName}`}
          style={{ top: `${((index + 1) * 100) / (variables.length + 1)}%` }}
        />
      ))}

      <NodeCardHeader
        kicker="Template"
        title={title}
        tone="black"
        rank={data?.executionRank}
        inCycle={data?.inCycle}
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        Type{' '}
        <span className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
          {'{{ variable }}'}
        </span>{' '}
        to expose a left-side input handle.
      </p>

      <label className="grid gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Prompt
        </span>
        <textarea
          value={currText}
          onChange={handleTextChange}
          spellCheck="false"
          style={{ height: dimensions.textareaHeight }}
          onWheelCapture={(event) => {
            const el = event.currentTarget;
            if (el.scrollHeight > el.clientHeight) event.stopPropagation();
          }}
          className={cn(
            'nodrag nowheel w-full resize-none rounded-md border bg-muted px-3 py-2.5 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-[color,box-shadow,background]',
            'focus-visible:border-brand-500 focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-brand-500/25',
            'overflow-y-auto',
          )}
        />
      </label>

      {variables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Variables
          </span>
          {variables.map((variableName) => (
            <Badge key={variableName} variant="mono">
              {variableName}
            </Badge>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} id={`${id}-output`} />
    </NodeCard>
  );
}
