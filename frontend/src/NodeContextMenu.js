import { nodeDefinitions } from './nodes/nodeDefinitions';
import { useStore } from './store';

const getNodeTitle = (node) => {
  return (
    node?.data?.displayName ||
    nodeDefinitions[node?.type]?.title ||
    nodeDefinitions[node?.type]?.label ||
    node?.id
  );
};

export const NodeContextMenu = ({ menu, onClose }) => {
  const nodes = useStore((state) => state.nodes);
  const updateNodeField = useStore((state) => state.updateNodeField);
  const duplicateNode = useStore((state) => state.duplicateNode);
  const deleteNode = useStore((state) => state.deleteNode);
  const node = nodes.find((currentNode) => currentNode.id === menu?.nodeId);

  if (!menu || !node) {
    return null;
  }

  const renameNode = () => {
    const nextName = window.prompt('Rename node', getNodeTitle(node));

    if (nextName?.trim()) {
      updateNodeField(node.id, 'displayName', nextName.trim());
    }

    onClose();
  };

  const copyNodeId = async () => {
    try {
      await navigator.clipboard.writeText(node.id);
    } catch {
      window.prompt('Copy node ID', node.id);
    }

    onClose();
  };

  const actions = [
    {
      label: 'Rename',
      meta: 'Change visible title',
      onClick: renameNode,
    },
    {
      label: 'Duplicate',
      meta: 'Create offset copy',
      onClick: () => {
        duplicateNode(node.id);
        onClose();
      },
    },
    {
      label: 'Copy ID',
      meta: node.id,
      onClick: copyNodeId,
    },
    {
      label: 'Delete',
      meta: 'Remove node and edges',
      danger: true,
      onClick: () => {
        deleteNode(node.id);
        onClose();
      },
    },
  ];

  return (
    <div
      className="node-context-menu"
      style={{ left: menu.x, top: menu.y }}
      role="menu"
      aria-label={`${getNodeTitle(node)} actions`}
    >
      <div className="context-menu-header">
        <span>Node actions</span>
        <strong>{getNodeTitle(node)}</strong>
      </div>
      <div className="context-menu-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={action.danger ? 'context-menu-danger' : undefined}
            onClick={action.onClick}
            role="menuitem"
          >
            <span>{action.label}</span>
            <small>{action.meta}</small>
          </button>
        ))}
      </div>
    </div>
  );
};
