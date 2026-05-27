import { createNodeComponent } from './BaseNode.jsx';
import { TextNode } from './TextNode.jsx';

export const nodeDefinitions = {
  customInput: {
    label: 'Input',
    kicker: 'Source',
    title: 'Input',
    tone: 'green',
    description: 'Accepts user-provided text, files, or structured JSON.',
    fields: [
      {
        name: 'inputName',
        label: 'Name',
        defaultValue: (id) => id.replace('customInput-', 'input_'),
      },
      {
        name: 'inputType',
        label: 'Type',
        type: 'select',
        defaultValue: 'Text',
        options: ['Text', 'File', 'JSON'],
      },
    ],
    outputs: [{ id: 'value' }],
  },
  llm: {
    label: 'LLM',
    kicker: 'AI',
    title: 'LLM',
    tone: 'violet',
    description: 'Combines system context and prompt text into an AI response.',
    fields: [
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        defaultValue: 'GPT-4.1',
        options: ['GPT-4.1', 'Claude 3.7', 'Gemini 2.5'],
      },
    ],
    inputs: [{ id: 'system' }, { id: 'prompt' }],
    outputs: [{ id: 'response' }],
  },
  customOutput: {
    label: 'Output',
    kicker: 'Sink',
    title: 'Output',
    tone: 'blue',
    description: 'Publishes the final workflow result.',
    fields: [
      {
        name: 'outputName',
        label: 'Name',
        defaultValue: (id) => id.replace('customOutput-', 'output_'),
      },
      {
        name: 'outputType',
        label: 'Type',
        type: 'select',
        defaultValue: 'Text',
        options: ['Text', 'Image', 'JSON'],
      },
    ],
    inputs: [{ id: 'value' }],
  },
  text: {
    label: 'Text',
    tone: 'black',
    description:
      'Compose prompt text and expose {{ variables }} as left-side inputs.',
    component: TextNode,
  },
  transform: {
    label: 'Transform',
    kicker: 'Logic',
    title: 'Transform',
    tone: 'amber',
    description: 'Formats incoming data before it moves downstream.',
    fields: [
      {
        name: 'operation',
        label: 'Operation',
        type: 'select',
        defaultValue: 'Summarize',
        options: ['Summarize', 'Normalize', 'Extract JSON', 'Translate'],
      },
    ],
    inputs: [{ id: 'input' }],
    outputs: [{ id: 'output' }],
  },
  filter: {
    label: 'Filter',
    kicker: 'Branch',
    title: 'Filter',
    tone: 'red',
    description: 'Routes items according to a simple condition.',
    fields: [
      {
        name: 'condition',
        label: 'Condition',
        defaultValue: 'score > 0.8',
      },
    ],
    inputs: [{ id: 'items' }],
    outputs: [{ id: 'passed' }, { id: 'rejected' }],
  },
  httpRequest: {
    label: 'HTTP',
    kicker: 'API',
    title: 'HTTP Request',
    tone: 'cyan',
    description: 'Calls an external service with the current payload.',
    fields: [
      {
        name: 'method',
        label: 'Method',
        type: 'select',
        defaultValue: 'POST',
        options: ['GET', 'POST', 'PATCH', 'DELETE'],
      },
      {
        name: 'url',
        label: 'URL',
        defaultValue: 'https://api.example.com/run',
      },
    ],
    inputs: [{ id: 'body' }],
    outputs: [{ id: 'response' }],
  },
  router: {
    label: 'Router',
    kicker: 'Flow',
    title: 'Router',
    tone: 'pink',
    description: 'Splits one result into multiple named branches.',
    fields: [
      {
        name: 'mode',
        label: 'Mode',
        type: 'select',
        defaultValue: 'Priority',
        options: ['Priority', 'Round robin', 'All branches'],
      },
    ],
    inputs: [{ id: 'input' }],
    outputs: [{ id: 'primary' }, { id: 'fallback' }, { id: 'audit' }],
  },
  database: {
    label: 'Database',
    kicker: 'Data',
    title: 'Database',
    tone: 'slate',
    description: 'Reads from or writes to a structured table.',
    fields: [
      {
        name: 'action',
        label: 'Action',
        type: 'select',
        defaultValue: 'Query',
        options: ['Query', 'Insert', 'Update'],
      },
      {
        name: 'table',
        label: 'Table',
        defaultValue: 'customers',
      },
    ],
    inputs: [{ id: 'query' }],
    outputs: [{ id: 'rows' }],
  },
};

export const nodeTypes = Object.fromEntries(
  Object.entries(nodeDefinitions).map(([type, definition]) => [
    type,
    definition.component ?? createNodeComponent(definition),
  ])
);

export const toolbarNodes = Object.entries(nodeDefinitions).map(
  ([type, definition]) => ({
    type,
    label: definition.label,
    tone: definition.tone ?? 'slate',
    description:
      definition.description ??
      'Compose prompt text and expose variables as node inputs.',
  })
);

export const createInitialNodeData = (nodeID, type) => {
  const definition = nodeDefinitions[type];

  return {
    id: nodeID,
    nodeType: type,
    ...(definition?.fields ?? []).reduce((values, field) => {
      values[field.name] =
        typeof field.defaultValue === 'function'
          ? field.defaultValue(nodeID)
          : field.defaultValue ?? '';
      return values;
    }, {}),
  };
};
