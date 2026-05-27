import { Handle, Position } from 'reactflow';
import { useStore } from '../store';

const getFieldValue = (field, id, data) => {
  if (data?.[field.name] !== undefined) {
    return data[field.name];
  }

  return typeof field.defaultValue === 'function'
    ? field.defaultValue(id)
    : field.defaultValue ?? '';
};

const renderField = ({ field, id, data, updateNodeField }) => {
  const value = getFieldValue(field, id, data);
  const commonProps = {
    id: `${id}-${field.name}`,
    value,
    onChange: (event) => updateNodeField(id, field.name, event.target.value),
    className: 'node-field-control',
  };

  if (field.type === 'select') {
    return (
      <select {...commonProps}>
        {field.options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return <textarea {...commonProps} rows={field.rows ?? 3} />;
  }

  return (
    <input
      {...commonProps}
      type={field.type ?? 'text'}
      placeholder={field.placeholder}
    />
  );
};

const renderHandles = (handles, side, id) => {
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
        className="node-handle"
        style={{ top }}
      />
    );
  });
};

export const BaseNode = ({ id, data, config }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const inputs = config.inputs ?? [];
  const outputs = config.outputs ?? [];
  const fields = config.fields ?? [];
  const title = data?.displayName || config.title;

  return (
    <div className={`pipeline-node pipeline-node--${config.tone ?? 'default'}`}>
      {renderHandles(inputs, 'left', id)}

      <div className="node-header">
        <span className="node-kicker">{config.kicker}</span>
        <strong>{title}</strong>
      </div>

      {config.description && (
        <p className="node-description">{config.description}</p>
      )}

      {fields.length > 0 && (
        <div className="node-fields">
          {fields.map((field) => (
            <label key={field.name} className="node-field">
              <span>{field.label}</span>
              {renderField({ field, id, data, updateNodeField })}
            </label>
          ))}
        </div>
      )}

      {renderHandles(outputs, 'right', id)}
    </div>
  );
};

export const createNodeComponent = (config) => {
  const ConfiguredNode = ({ id, data }) => (
    <BaseNode id={id} data={data} config={config} />
  );

  ConfiguredNode.displayName = `${config.title.replace(/\s+/g, '')}Node`;
  return ConfiguredNode;
};
