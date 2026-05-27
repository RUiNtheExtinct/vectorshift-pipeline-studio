// draggableNode.js

export const DraggableNode = ({ type, label, description }) => {
    const onDragStart = (event, nodeType) => {
      const appData = { nodeType }
      event.currentTarget.style.cursor = 'grabbing';
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
    };
  
    return (
      <div
        className={`draggable-node draggable-node--${type}`}
        data-tooltip={description}
        aria-label={`${label}: ${description}`}
        title={description}
        onDragStart={(event) => onDragStart(event, type)}
        onDragEnd={(event) => (event.currentTarget.style.cursor = 'grab')}
        draggable
      >
          <span className="draggable-node-icon" aria-hidden="true" />
          <span>{label}</span>
      </div>
    );
  };
  
