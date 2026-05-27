// submit.js

import { useState } from 'react';
import { useStore } from './store';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8000';

export const SubmitButton = () => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/pipelines/parse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nodes, edges }),
            });

            if (!response.ok) {
                throw new Error(`Backend returned ${response.status}`);
            }

            const result = await response.json();
            const dagMessage = result.is_dag
                ? 'This pipeline is a DAG and is ready to run.'
                : 'This pipeline contains a cycle and needs to be fixed.';

            window.alert(
                [
                    'Pipeline analysis complete',
                    '',
                    `Nodes: ${result.num_nodes}`,
                    `Edges: ${result.num_edges}`,
                    `DAG: ${result.is_dag ? 'Yes' : 'No'}`,
                    '',
                    dagMessage,
                ].join('\n')
            );
        } catch (error) {
            window.alert(
                [
                    'Unable to analyze the pipeline.',
                    '',
                    'Make sure the backend is running with:',
                    'uvicorn main:app --reload',
                    '',
                    `Details: ${error.message}`,
                ].join('\n')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <button
            className="submit-button"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
        >
            {isSubmitting ? 'Analyzing...' : 'Submit Pipeline'}
        </button>
    );
}
