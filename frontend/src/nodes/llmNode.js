import { createNodeComponent } from './BaseNode';
import { nodeDefinitions } from './nodeDefinitions';

export const LLMNode = createNodeComponent(nodeDefinitions.llm);
