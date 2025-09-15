"""
Causal analysis service: learn DAG with causal-learn, estimate causal effects with DoWhy.
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional, Tuple
import io
import pandas as pd
import numpy as np
import logging
import networkx as nx

from dowhy import CausalModel
from causallearn.utils.GraphUtils import GraphUtils
from causallearn.search.ConstraintBased.PC import pc
from causallearn.utils.cit import fisherz

logger = logging.getLogger(__name__)


class CausalService:
    """Runs a simple pipeline: learn DAG via PC, then use DoWhy for estimation."""

    def __init__(self):
        pass

    def _learn_graph_pc(self, df: pd.DataFrame, alpha: float = 0.05) -> Any:
        data = df.to_numpy(dtype=float)
        # Variable names preserved for serialization
        var_names = list(df.columns)
        cg = pc(data, indep_test_func=fisherz, alpha=alpha, node_names=var_names)
        return cg

    def _graph_to_edge_sets(self, cg) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
        """Return (directed_edges, viz_edges) from a learned CPDAG/DAG.
        - directed_edges: only edges without reverse counterpart (safe for DoWhy)
        - viz_edges: directed_edges plus one representative for each undirected pair
        """
        G = GraphUtils.to_nx_graph(cg.G, labels=cg.G.names)
        dir_edges: List[Dict[str, str]] = []
        viz_edges: List[Dict[str, str]] = []
        edge_set = set(G.edges())
        seen_undirected = set()
        for u, v in G.edges():
            u = str(u)
            v = str(v)
            if (v, u) in edge_set:
                # undirected pair; add only once with a deterministic orientation for viz
                key = tuple(sorted((u, v)))
                if key not in seen_undirected:
                    seen_undirected.add(key)
                    # Choose orientation alphabetically for visualization
                    a, b = key
                    viz_edges.append({"source": a, "target": b})
            else:
                # true directed edge
                e = {"source": u, "target": v}
                dir_edges.append(e)
                viz_edges.append(e)
        return dir_edges, viz_edges

    def _edges_to_dot(self, nodes: List[str], edges: List[Dict[str, str]]) -> str:
        # Build a DOT DAG string for DoWhy
        lines = ["digraph G {"]
        for n in nodes:
            lines.append(f'  "{n}";')
        for e in edges:
            lines.append(f'  "{e["source"]}" -> "{e["target"]}";')
        lines.append("}")
        return "\n".join(lines)

    def _select_columns_for_pc(
        self, df: pd.DataFrame, treatment: str, outcome: str
    ) -> List[str]:
        """Select a safe subset of columns for PC based on sample size.
        Keep treatment/outcome and add up to a capped number of other variables ranked by
        absolute correlation with outcome, ensuring p < n+1 to avoid math domain errors in Fisher-Z.
        """
        n, p = df.shape
        # Always include treatment & outcome
        base = [c for c in [treatment, outcome] if c in df.columns]
        # Maximum variables allowed so that p < n + 1 and keep small for speed
        max_vars_allowed = max(2, min(df.shape[1], max(2, min(n - 1, 12))))
        if len(base) >= max_vars_allowed:
            return base[:max_vars_allowed]

        # Rank remaining columns by correlation with outcome (abs), fallback to variance if needed
        remaining = [c for c in df.columns if c not in base]
        scores = {}
        for c in remaining:
            try:
                if outcome in df.columns:
                    corr = df[c].astype(float).corr(df[outcome].astype(float))
                    scores[c] = 0.0 if pd.isna(corr) else abs(float(corr))
                else:
                    scores[c] = float(df[c].astype(float).std() or 0.0)
            except Exception:
                scores[c] = 0.0
        ranked = sorted(remaining, key=lambda k: scores.get(k, 0.0), reverse=True)
        take = max_vars_allowed - len(base)
        return base + ranked[: max(0, take)]

    def run(
        self,
        df: pd.DataFrame,
        treatment: str,
        outcome: str,
        common_causes: Optional[List[str]] = None,
        effect_modifiers: Optional[List[str]] = None,
        alpha: float = 0.05,
        estimator: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        - Learn a graph with PC
        - Build DoWhy model from DataFrame and learned structure
        - Identify and estimate the causal effect (linear, backdoor)
        """
        # Coerce to numeric where possible
        df_num = df.copy()
        for col in df_num.columns:
            if not np.issubdtype(df_num[col].dtype, np.number):
                df_num[col] = pd.to_numeric(df_num[col], errors="coerce")
        df_num = df_num.dropna()

        if treatment not in df_num.columns or outcome not in df_num.columns:
            raise ValueError("treatment or outcome not found in dataframe")

        # Drop constant columns (zero variance) to avoid degenerate correlations
        non_const_cols = [
            c for c in df_num.columns if df_num[c].nunique(dropna=True) > 1
        ]
        if len(non_const_cols) < 2:
            # Not enough signal, fallback to minimal edge set
            edges_directed = [{"source": treatment, "target": outcome}]
            edges_viz = list(edges_directed)
        else:
            df_pc_base = df_num[non_const_cols]
            # Select a safe subset of variables for PC to avoid small-sample domain errors
            # Allow more variables if sample size permits (cap at 20)
            n = len(df_pc_base)
            if len(non_const_cols) <= max(3, min(n - 2, 20)):
                subset_cols = list(non_const_cols)
            else:
                subset_cols = self._select_columns_for_pc(df_pc_base, treatment, outcome)
            # Ensure treatment/outcome present
            if treatment not in subset_cols:
                subset_cols = [treatment] + [c for c in subset_cols if c != treatment]
            if outcome not in subset_cols:
                subset_cols = [outcome] + [c for c in subset_cols if c != outcome]

            df_pc = df_pc_base[subset_cols]

            # Try PC; if it fails due to math domain issues, fallback to minimal graph
            try:
                cg = self._learn_graph_pc(df_pc, alpha=alpha)
                edges_directed, edges_viz = self._graph_to_edge_sets(cg)
            except ValueError as e:
                logger.warning(
                    f"PC failed with ValueError: {e}. Falling back to minimal graph T->Y."
                )
                edges_directed = [{"source": treatment, "target": outcome}]
                edges_viz = list(edges_directed)
            except Exception as e:
                logger.exception(
                    "PC failed unexpectedly; falling back to minimal graph."
                )
                edges_directed = [{"source": treatment, "target": outcome}]
                edges_viz = list(edges_directed)

        # Use all available columns as graph nodes for visualization and modeling
        graph_nodes = list(df_num.columns)
        dot_graph = self._edges_to_dot(graph_nodes, edges_directed)

        # Build DoWhy model
        # Use the data corresponding to nodes in the learned/fallback graph
        data_for_model = df_num[graph_nodes]

        # Build a NetworkX DiGraph for DoWhy to avoid DOT parsing issues
        nx_graph = nx.DiGraph()
        nx_graph.add_nodes_from(graph_nodes)
        nx_graph.add_edges_from([(e["source"], e["target"]) for e in edges_directed])

        model = CausalModel(
            data=data_for_model, treatment=treatment, outcome=outcome, graph=nx_graph
        )

        # Identify effect; DoWhy will determine a valid adjustment strategy from the graph
        identified_estimand = model.identify_effect(proceed_when_unidentifiable=True)

        # Try a few reasonable estimators in order of simplicity
        estimate = None
        est_error = None
        preferred: List[str] = []
        if estimator:
            est_map = {
                "linear_regression": "backdoor.linear_regression",
                "psw": "backdoor.propensity_score_weighting",
                "propensity_score_weighting": "backdoor.propensity_score_weighting",
                "psm": "backdoor.propensity_score_matching",
                "propensity_score_matching": "backdoor.propensity_score_matching",
                "auto": None,
            }
            mapped = est_map.get(estimator)
            if mapped:
                preferred = [mapped]
        methods_order = preferred + [
            m
            for m in [
                "backdoor.linear_regression",
                "backdoor.propensity_score_weighting",
                "backdoor.propensity_score_matching",
            ]
            if m not in preferred
        ]
        for method in methods_order:
            try:
                estimate = model.estimate_effect(
                    identified_estimand, method_name=method
                )
                break
            except Exception as e:
                est_error = str(e)
                continue

        # Try refutation only if we have a valid estimate
        refute = None
        if estimate is not None:
            try:
                refute = model.refute_estimate(
                    identified_estimand,
                    estimate,
                    method_name="random_common_cause",
                )
            except Exception as e:
                refute = f"Refutation failed: {e}"

        # --- Effect size metrics (heuristic) ---
        effect_metrics: Dict[str, Any] = {}
        try:
            est_val = float(estimate.value) if getattr(estimate, "value", None) is not None else None
        except Exception:
            est_val = None
        if est_val is not None:
            try:
                # Treatment descriptive stats
                t_series = data_for_model[treatment].astype(float)
                y_series = data_for_model[outcome].astype(float)
                t_mean = float(t_series.mean())
                y_mean = float(y_series.mean())
                y_std = float(y_series.std(ddof=1)) if y_series.std(ddof=1) not in (None, 0, np.nan) else None
                # If treatment appears binary, compute group means diff for context
                group_diff = None
                if t_series.nunique(dropna=True) == 2:
                    vals = sorted(t_series.dropna().unique())
                    g0 = y_series[t_series == vals[0]]
                    g1 = y_series[t_series == vals[1]]
                    if len(g0) > 1 and len(g1) > 1:
                        group_diff = float(g1.mean() - g0.mean())
                pct_of_mean = (est_val / y_mean * 100.0) if y_mean not in (0, None, np.nan) else None
                standardized = (est_val / y_std) if y_std not in (None, 0, np.nan) else None
                effect_metrics = {
                    "estimate_value": est_val,
                    "outcome_mean": y_mean,
                    "outcome_std": y_std,
                    "treatment_mean": t_mean,
                    "group_mean_diff" : group_diff,
                    "percent_of_outcome_mean": pct_of_mean,
                    "standardized_effect": standardized,
                    # A composite score we can highlight in UI: prefer standardized, else percent, else raw
                    "effect_score": (
                        standardized if standardized not in (None, np.nan) else (
                            pct_of_mean if pct_of_mean not in (None, np.nan) else est_val
                        )
                    ),
                }
            except Exception as e:
                effect_metrics = {"error": f"Effect size computation failed: {e}"}

        return {
            "columns": list(df.columns),
            "learned_graph": {
                "nodes": graph_nodes,
                "edges": edges_viz,
                "edges_directed": edges_directed,
                "dot": dot_graph,
                "algorithm": "PC",
                "alpha": alpha,
            },
            "estimand": str(identified_estimand),
            "estimate_value": (
                float(estimate.value)
                if getattr(estimate, "value", None) is not None
                else None
            ),
            "estimate": (
                str(estimate)
                if estimate is not None
                else (f"Estimation failed: {est_error}" if est_error else None)
            ),
            "refutation": str(refute),
            "effect_size": effect_metrics,
        }
