"""Pipeline Studio backend.

A small FastAPI service that accepts a pipeline graph (nodes + edges) and
returns its node/edge counts, whether it is a directed acyclic graph, and
helpers for visualizing cycles and execution order on the frontend.
"""

from __future__ import annotations

import logging
import os
from collections import deque
from typing import Any, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# --------------------------------------------------------------------------- #
# Configuration                                                                #
# --------------------------------------------------------------------------- #

SERVICE_NAME = "pipeline-studio-backend"
SERVICE_VERSION = "1.1.0"

DEFAULT_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:4173,"
    "http://127.0.0.1:4173"
)


def _parse_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _resolve_origins() -> list[str]:
    """Combine explicit origins + any FRONTEND_HOST wired in by deploy targets."""
    raw = os.environ.get("CORS_ALLOWED_ORIGINS", DEFAULT_ORIGINS)
    origins = _parse_origins(raw)
    frontend_host = os.environ.get("FRONTEND_HOST", "").strip()
    if frontend_host and not frontend_host.startswith(("http://", "https://")):
        origins.append(f"https://{frontend_host}")
    elif frontend_host:
        origins.append(frontend_host)
    # De-duplicate while preserving order.
    seen: set[str] = set()
    unique: list[str] = []
    for origin in origins:
        if origin not in seen:
            seen.add(origin)
            unique.append(origin)
    return unique


CORS_ALLOWED_ORIGINS = _resolve_origins()

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
logger = logging.getLogger(SERVICE_NAME)


# --------------------------------------------------------------------------- #
# App + middleware                                                             #
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="Pipeline Studio",
    description=(
        "Analyzes a pipeline graph submitted from the Pipeline Studio "
        "frontend. Returns node/edge counts, DAG status, the cycle (when "
        "present), and a topological execution order."
    ),
    version=SERVICE_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.warning("Validation error on %s :: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": "Invalid pipeline payload.",
            "errors": exc.errors(),
        },
    )


# --------------------------------------------------------------------------- #
# Schemas                                                                      #
# --------------------------------------------------------------------------- #


class PipelineNode(BaseModel):
    id: str = Field(min_length=1, max_length=200, description="Unique node identifier.")
    type: Optional[str] = Field(default=None, max_length=80)
    data: Optional[dict[str, Any]] = None


class PipelineEdge(BaseModel):
    id: Optional[str] = Field(default=None, max_length=200)
    source: str = Field(min_length=1, max_length=200)
    target: str = Field(min_length=1, max_length=200)


class PipelinePayload(BaseModel):
    nodes: list[PipelineNode] = Field(default_factory=list)
    edges: list[PipelineEdge] = Field(default_factory=list)


class PipelineAnalysis(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool
    cycle_node_ids: list[str] = Field(
        default_factory=list,
        description="Node IDs that participate in the detected cycle (empty for a DAG).",
    )
    cycle_edge_ids: list[str] = Field(
        default_factory=list,
        description=(
            "Edge IDs that participate in the detected cycle. An edge ID is "
            "either its explicit `id` field or the synthetic `source->target` "
            "string used by ReactFlow."
        ),
    )
    execution_order: list[str] = Field(
        default_factory=list,
        description="Topological execution order (empty when the graph has a cycle).",
    )
    invalid_edges: list[dict[str, str]] = Field(
        default_factory=list,
        description="Edges that reference a missing source or target node.",
    )


class HealthStatus(BaseModel):
    status: str
    service: str
    version: str


# --------------------------------------------------------------------------- #
# Graph analysis                                                               #
# --------------------------------------------------------------------------- #


def _edge_identifier(edge: PipelineEdge) -> str:
    return edge.id or f"{edge.source}->{edge.target}"


def analyze_graph(payload: PipelinePayload) -> PipelineAnalysis:
    """Run Kahn's algorithm + cycle extraction over the submitted pipeline.

    Edges that point to missing nodes are recorded under `invalid_edges` and
    cause `is_dag` to be False without considering them part of the graph.
    """

    node_ids: set[str] = {node.id for node in payload.nodes}
    adjacency: dict[str, list[str]] = {node_id: [] for node_id in node_ids}
    indegree: dict[str, int] = {node_id: 0 for node_id in node_ids}
    invalid_edges: list[dict[str, str]] = []

    valid_edges: list[PipelineEdge] = []
    for edge in payload.edges:
        if edge.source not in node_ids or edge.target not in node_ids:
            invalid_edges.append(
                {
                    "id": _edge_identifier(edge),
                    "source": edge.source,
                    "target": edge.target,
                }
            )
            continue
        adjacency[edge.source].append(edge.target)
        indegree[edge.target] += 1
        valid_edges.append(edge)

    queue: deque[str] = deque(
        node_id for node_id, degree in indegree.items() if degree == 0
    )
    execution_order: list[str] = []
    remaining_indegree = dict(indegree)

    while queue:
        current = queue.popleft()
        execution_order.append(current)
        for neighbor in adjacency[current]:
            remaining_indegree[neighbor] -= 1
            if remaining_indegree[neighbor] == 0:
                queue.append(neighbor)

    is_dag = len(execution_order) == len(node_ids) and not invalid_edges

    cycle_node_ids: list[str] = []
    cycle_edge_ids: list[str] = []
    if not is_dag and len(execution_order) != len(node_ids):
        cycle_node_ids = sorted(
            node_id
            for node_id, degree in remaining_indegree.items()
            if degree > 0 or node_id not in execution_order
        )
        cycle_edge_ids = [
            _edge_identifier(edge)
            for edge in valid_edges
            if edge.source in cycle_node_ids and edge.target in cycle_node_ids
        ]

    return PipelineAnalysis(
        num_nodes=len(payload.nodes),
        num_edges=len(payload.edges),
        is_dag=is_dag,
        cycle_node_ids=cycle_node_ids,
        cycle_edge_ids=cycle_edge_ids,
        execution_order=execution_order if is_dag else [],
        invalid_edges=invalid_edges,
    )


# --------------------------------------------------------------------------- #
# Routes                                                                       #
# --------------------------------------------------------------------------- #


@app.get("/", tags=["meta"])
def read_root() -> dict[str, str]:
    return {"Ping": "Pong"}


@app.get("/health", response_model=HealthStatus, tags=["meta"])
def health() -> HealthStatus:
    return HealthStatus(status="ok", service=SERVICE_NAME, version=SERVICE_VERSION)


@app.post("/pipelines/parse", response_model=PipelineAnalysis, tags=["pipelines"])
def parse_pipeline(payload: PipelinePayload) -> PipelineAnalysis:
    analysis = analyze_graph(payload)
    logger.info(
        "Parsed pipeline (nodes=%d edges=%d dag=%s cycle=%d invalid=%d)",
        analysis.num_nodes,
        analysis.num_edges,
        analysis.is_dag,
        len(analysis.cycle_node_ids),
        len(analysis.invalid_edges),
    )
    return analysis
