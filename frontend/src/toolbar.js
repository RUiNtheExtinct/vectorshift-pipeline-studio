// toolbar.js

import { DraggableNode } from './draggableNode';
import { toolbarNodes } from './nodes/nodeDefinitions';

export const PipelineToolbar = () => {

    return (
        <aside className="pipeline-toolbar">
            <div className="toolbar-copy">
                <span>Node library</span>
                <strong>Drag modules into the canvas</strong>
            </div>
            <div className="toolbar-node-grid">
                {toolbarNodes.map((node) => (
                    <DraggableNode
                        key={node.type}
                        type={node.type}
                        label={node.label}
                        description={node.description}
                    />
                ))}
            </div>
        </aside>
    );
};
