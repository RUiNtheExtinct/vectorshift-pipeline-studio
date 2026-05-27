from typing import Any, Dict, List, Optional, Set

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PipelineNode(BaseModel):
    id: str
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class PipelineEdge(BaseModel):
    id: Optional[str] = None
    source: str
    target: str


class PipelinePayload(BaseModel):
    nodes: List[PipelineNode] = Field(default_factory=list)
    edges: List[PipelineEdge] = Field(default_factory=list)


def is_directed_acyclic_graph(nodes: List[PipelineNode], edges: List[PipelineEdge]) -> bool:
    node_ids: Set[str] = {node.id for node in nodes}
    adjacency: Dict[str, List[str]] = {node_id: [] for node_id in node_ids}
    indegree: Dict[str, int] = {node_id: 0 for node_id in node_ids}

    for edge in edges:
        if edge.source not in node_ids or edge.target not in node_ids:
            return False

        adjacency[edge.source].append(edge.target)
        indegree[edge.target] += 1

    queue = [node_id for node_id, degree in indegree.items() if degree == 0]
    visited_count = 0

    while queue:
        node_id = queue.pop(0)
        visited_count += 1

        for neighbor in adjacency[node_id]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    return visited_count == len(node_ids)


@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

@app.post('/pipelines/parse')
def parse_pipeline(payload: PipelinePayload):
    return {
        'num_nodes': len(payload.nodes),
        'num_edges': len(payload.edges),
        'is_dag': is_directed_acyclic_graph(payload.nodes, payload.edges),
    }
