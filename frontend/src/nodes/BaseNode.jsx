import * as React from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Tone styling                                                       */
/* ------------------------------------------------------------------ */

const toneAccent = {
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

const toneText = {
  green: 'text-tone-green',
  violet: 'text-tone-violet',
  blue: 'text-tone-blue',
  amber: 'text-tone-amber',
  red: 'text-tone-red',
  cyan: 'text-tone-cyan',
  pink: 'text-tone-pink',
  slate: 'text-tone-slate',
  black: 'text-tone-black',
};

/* ------------------------------------------------------------------ */
/* Field rendering                                                    */
/* ------------------------------------------------------------------ */

const inputBase =
  'nodrag nowheel w-full h-9 rounded-md border bg-muted px-2.5 py-1.5 text-sm font-medium text-foreground outline-none transition-[color,box-shadow,background] focus-visible:border-brand-500 focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-brand-500/25';

const getFieldValue = (field, id, data) => {
  if (data?.[field.name] !== undefined) return data[field.name];
  return typeof field.defaultValue === 'function'
    ? field.defaultValue(id)
    : field.defaultValue ?? '';
};

function NodeField({ field, id, data, updateNodeField }) {
  const value = getFieldValue(field, id, data);
  const fieldId = `${id}-${field.name}`;
  const onChange = (event) =>
    updateNodeField(id, field.name, event.target.value);

  return (
    <label className="grid gap-1.5" htmlFor={fieldId}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {field.label}
      </span>
      {field.type === 'select' ? (
        <select id={fieldId} value={value} onChange={onChange} className={inputBase}>
          {field.options.map((option) => {
            const optionValue = option.value ?? option;
            const optionLabel = option.label ?? option;
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={onChange}
          rows={field.rows ?? 3}
          className={cn(inputBase, 'min-h-[68px] resize-none leading-relaxed')}
        />
      ) : (
        <input
          id={fieldId}
          value={value}
          onChange={onChange}
          type={field.type ?? 'text'}
          placeholder={field.placeholder}
          className={inputBase}
        />
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Handle rendering                                                   */
/* ------------------------------------------------------------------ */

function renderHandles(handles, side, id) {
  const position = side === 'left' ? Position.Left : Position.Right;
  const type = side === 'left' ? 'target' : 'source';
  const count = Math.max(handles.length, 1);

  return handles.map((handle, index) => {
    const top = handle.top ?? `${((index + 1) * 100) / (count + 1)}%`;
    return (
      <Handle
        key={`${side}-${handle.id}`}
        type={handle.type ?? type}
        position={handle.position ?? position}
        id={`${id}-${handle.id}`}
        style={{ top }}
      />
    );
  });
}

/* ------------------------------------------------------------------ */
/* Card chrome                                                         */
/* ------------------------------------------------------------------ */

export function NodeCard({ children, tone = 'blue', className, style }) {
  return (
    <div
      style={style}
      className={cn(
        'relative w-[264px] overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_-12px_oklch(0_0_0/0.18)] dark:shadow-[0_8px_24px_-12px_oklch(0_0_0/0.6)] transition-shadow',
        'hover:shadow-[0_16px_32px_-12px_oklch(0_0_0/0.22)] dark:hover:shadow-[0_16px_32px_-12px_oklch(0_0_0/0.8)]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-[3px]',
          toneAccent[tone] ?? toneAccent.slate,
        )}
      />
      <div className="grid gap-3 pl-4 pr-3.5 py-3.5">{children}</div>
    </div>
  );
}

export function NodeCardHeader({ kicker, title, tone = 'slate', rank, inCycle }) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span
          className={cn(
            'block text-[10px] font-semibold uppercase tracking-[0.08em]',
            toneText[tone] ?? toneText.slate,
          )}
        >
          {kicker}
        </span>
        <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-col items-end gap-1">
        {rank != null && (
          <span
            title={`Execution step ${rank}`}
            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-50 px-1.5 font-mono text-[10px] font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200"
          >
            {rank}
          </span>
        )}
        {inCycle && (
          <span
            title="This node is part of a cycle"
            className="inline-flex h-5 items-center justify-center rounded-full bg-red-50 px-2 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-950/60 dark:text-red-300"
          >
            Cycle
          </span>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Configurable node                                                   */
/* ------------------------------------------------------------------ */

export function BaseNode({ id, data, config }) {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const inputs = config.inputs ?? [];
  const outputs = config.outputs ?? [];
  const fields = config.fields ?? [];
  const title = data?.displayName || config.title;

  return (
    <NodeCard tone={config.tone}>
      {renderHandles(inputs, 'left', id)}
      <NodeCardHeader
        kicker={config.kicker}
        title={title}
        tone={config.tone}
        rank={data?.executionRank}
        inCycle={data?.inCycle}
      />
      {config.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {config.description}
        </p>
      )}
      {fields.length > 0 && (
        <div className="grid gap-3">
          {fields.map((field) => (
            <NodeField
              key={field.name}
              field={field}
              id={id}
              data={data}
              updateNodeField={updateNodeField}
            />
          ))}
        </div>
      )}
      {renderHandles(outputs, 'right', id)}
    </NodeCard>
  );
}

export function createNodeComponent(config) {
  const ConfiguredNode = ({ id, data }) => (
    <BaseNode id={id} data={data} config={config} />
  );
  ConfiguredNode.displayName = `${config.title.replace(/\s+/g, '')}Node`;
  return ConfiguredNode;
}
