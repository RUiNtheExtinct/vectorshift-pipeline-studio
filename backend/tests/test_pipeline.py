"""Unit + endpoint tests for the pipeline analyzer."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import (
    PipelineEdge,
    PipelineNode,
    PipelinePayload,
    analyze_graph,
    app,
)

client = TestClient(app)


# --------------------------------------------------------------------------- #
# analyze_graph: pure function                                                 #
# --------------------------------------------------------------------------- #


def _payload(nodes, edges):
    return PipelinePayload(
        nodes=[PipelineNode(id=n) for n in nodes],
        edges=[PipelineEdge(source=s, target=t) for s, t in edges],
    )


def test_linear_chain_is_dag():
    analysis = analyze_graph(_payload(["a", "b", "c"], [("a", "b"), ("b", "c")]))
    assert analysis.num_nodes == 3
    assert analysis.num_edges == 2
    assert analysis.is_dag is True
    assert analysis.cycle_node_ids == []
    assert analysis.cycle_edge_ids == []
    assert analysis.execution_order == ["a", "b", "c"]
    assert analysis.invalid_edges == []


def test_simple_cycle_is_not_dag():
    analysis = analyze_graph(_payload(["a", "b"], [("a", "b"), ("b", "a")]))
    assert analysis.is_dag is False
    assert set(analysis.cycle_node_ids) == {"a", "b"}
    assert set(analysis.cycle_edge_ids) == {"a->b", "b->a"}
    assert analysis.execution_order == []


def test_three_node_cycle():
    analysis = analyze_graph(_payload(["a", "b", "c"], [("a", "b"), ("b", "c"), ("c", "a")]))
    assert analysis.is_dag is False
    assert set(analysis.cycle_node_ids) == {"a", "b", "c"}
    assert set(analysis.cycle_edge_ids) == {"a->b", "b->c", "c->a"}


def test_empty_graph_is_vacuously_dag():
    analysis = analyze_graph(_payload([], []))
    assert analysis.num_nodes == 0
    assert analysis.num_edges == 0
    assert analysis.is_dag is True
    assert analysis.execution_order == []


def test_single_node_is_dag():
    analysis = analyze_graph(_payload(["only"], []))
    assert analysis.is_dag is True
    assert analysis.execution_order == ["only"]


def test_invalid_edge_breaks_dag():
    analysis = analyze_graph(_payload(["a"], [("a", "ghost")]))
    assert analysis.is_dag is False
    assert analysis.invalid_edges == [
        {"id": "a->ghost", "source": "a", "target": "ghost"}
    ]
    assert analysis.cycle_node_ids == []


def test_disconnected_components_are_still_a_dag():
    analysis = analyze_graph(
        _payload(["a", "b", "c", "d"], [("a", "b"), ("c", "d")])
    )
    assert analysis.is_dag is True
    assert analysis.num_nodes == 4
    assert analysis.num_edges == 2
    assert set(analysis.execution_order) == {"a", "b", "c", "d"}


def test_dag_with_diamond_shape():
    analysis = analyze_graph(
        _payload(
            ["a", "b", "c", "d"],
            [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")],
        )
    )
    assert analysis.is_dag is True
    # Topological order must place a first and d last.
    assert analysis.execution_order[0] == "a"
    assert analysis.execution_order[-1] == "d"


# --------------------------------------------------------------------------- #
# API surface                                                                  #
# --------------------------------------------------------------------------- #


def test_root_pings_pong():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Ping": "Pong"}


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "pipeline-studio-backend"
    assert "version" in body


def test_parse_endpoint_returns_full_analysis():
    response = client.post(
        "/pipelines/parse",
        json={
            "nodes": [{"id": "a"}, {"id": "b"}],
            "edges": [{"source": "a", "target": "b"}],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["num_nodes"] == 2
    assert body["num_edges"] == 1
    assert body["is_dag"] is True
    assert body["execution_order"] == ["a", "b"]


def test_parse_endpoint_rejects_malformed_payload():
    response = client.post(
        "/pipelines/parse",
        json={"nodes": [{"id": ""}], "edges": []},  # empty id forbidden
    )
    assert response.status_code == 400
    body = response.json()
    assert body["detail"] == "Invalid pipeline payload."
    assert "errors" in body
