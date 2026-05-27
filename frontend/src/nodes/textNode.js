import { useEffect, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useStore } from '../store';

const reservedWords = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

const variablePattern = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;
const TEXT_NODE_MIN_WIDTH = 260;
const TEXT_NODE_MAX_WIDTH = 520;
const TEXTAREA_MIN_HEIGHT = 84;
const TEXTAREA_MAX_HEIGHT = 220;

const getTemplateVariables = (text) => {
  const variables = [];
  const seen = new Set();
  let match;

  while ((match = variablePattern.exec(text)) !== null) {
    const variableName = match[1];

    if (!reservedWords.has(variableName) && !seen.has(variableName)) {
      seen.add(variableName);
      variables.push(variableName);
    }
  }

  return variables;
};

const getTextDimensions = (text) => {
  const lines = text.split('\n');
  const longestLine = lines.reduce((longest, line) => {
    return Math.max(longest, line.length);
  }, 0);
  const textareaHeight = Math.min(
    TEXTAREA_MAX_HEIGHT,
    Math.max(TEXTAREA_MIN_HEIGHT, lines.length * 22 + 36)
  );

  return {
    width: Math.min(
      TEXT_NODE_MAX_WIDTH,
      Math.max(TEXT_NODE_MIN_WIDTH, longestLine * 8 + 96)
    ),
    minHeight: textareaHeight + 150,
    textareaHeight,
  };
};

export const TextNode = ({ id, data }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const updateNodeInternals = useUpdateNodeInternals();
  const currText = data?.text ?? '{{ input }}';
  const variables = useMemo(() => getTemplateVariables(currText), [currText]);
  const dimensions = useMemo(() => getTextDimensions(currText), [currText]);
  const title = data?.displayName || 'Text';

  const handleTextChange = (e) => {
    updateNodeField(id, 'text', e.target.value);
  };

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, variables]);

  return (
    <div
      className="pipeline-node pipeline-node--text"
      style={{ width: dimensions.width, minHeight: dimensions.minHeight }}
    >
      {variables.map((variableName, index) => (
        <Handle
          key={variableName}
          type="target"
          position={Position.Left}
          id={`${id}-${variableName}`}
          className="node-handle"
          style={{ top: `${((index + 1) * 100) / (variables.length + 1)}%` }}
        />
      ))}

      <div className="node-header">
        <span className="node-kicker">Template</span>
        <strong>{title}</strong>
      </div>

      <p className="node-description">
        Type {'{{ variable }}'} to expose a left-side input handle.
      </p>

      <label className="node-field">
        <span>Prompt</span>
        <textarea
          className="node-field-control node-textarea"
          value={currText}
          onChange={handleTextChange}
          style={{ height: dimensions.textareaHeight }}
          spellCheck="false"
        />
      </label>

      {variables.length > 0 && (
        <div className="variable-list">
          {variables.map((variableName) => (
            <span key={variableName} className="variable-pill">
              {variableName}
            </span>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-output`}
        className="node-handle"
      />
    </div>
  );
};
