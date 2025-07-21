# graph_service.py
"""Core similarity‑graph logic for Spotify VibeMap.

This module extracts the reusable pieces from the original *temp1.py* and *temp2.py*
proof‑of‑concept scripts so they can be imported by your Flask server.  All blocking
I/O, CLI prompts, matplotlib visualisation and hard‑coded secrets have been removed.

Typical usage from a Flask route (pseudo‑code):

```python
from flask import Blueprint, request, jsonify
from graph_service import GraphService, load_state
import spotipy

bp = Blueprint("graph", __name__)
load_state()                   # optional – restore cached graph on start‑up

@bp.route("/api/graph/update", methods=["POST"])
@token_required               # your existing JWT decorator
def update_graph():
    data = request.get_json()
    playlist_ids = data["playlist_ids"]          # list[str]

    sp = spotipy.Spotify(auth=request.headers["Spotify-Access-Token"])
    changed = GraphService.add_playlists(playlist_ids, sp)
    if changed:
        GraphService.save_state()
    return jsonify({"updated": changed}), 200

@bp.route("/api/graph/<user_id>")
@token_required
def get_graph(user_id):
    sub = GraphService.subgraph_for_playlists(user_id_playlist_ids)
    return jsonify(sub), 200
```
"""
from __future__ import annotations

from collections import defaultdict
from itertools import combinations
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple

import hashlib
import json
import os
import pickle

import networkx as nx
import numpy as np
from node2vec import Node2Vec
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

STATE_FILE = Path(os.getenv("VIBEMAP_GRAPH_STATE", "playlist_similarity_state.pkl"))
EMBEDDING_DIM = 32
NODE2VEC_KWARGS = dict(walk_length=5, num_walks=10, workers=0) # set workesr to cpu count - should we do this?? TODO

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash_songs(song_ids: Iterable[str]) -> str:
    """Deterministic SHA‑256 hash of an *unordered* collection of Spotify IDs."""
    return hashlib.sha256("".join(sorted(song_ids)).encode()).hexdigest()

# ---------------------------------------------------------------------------
# Core service class
# ---------------------------------------------------------------------------

class GraphService:
    """Singleton‑style namespace that stores the global song graph and embeddings."""

    # Class‑level (module‑wide) state ---------------------------------------
    co_occurrence: Dict[Tuple[str, str], int] = defaultdict(int)
    playlist_data: Dict[str, Set[str]] = {}
    playlist_hashes: Dict[str, str] = {}
    song_metadata: Dict[str, str] = {}
    G: nx.Graph = nx.Graph()
    node2vec_model = None  # type: ignore

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------

    @classmethod
    def add_playlists(cls, playlist_ids: Iterable[str], sp_client) -> bool:
        """Fetch tracks for each playlist ID via *sp_client* and update the graph.

        Returns **True** if anything changed (new playlists or song lists).
        *sp_client* is an *authenticated* Spotipy client that already contains a
        user access token – this means it respects each user’s scopes and rate
        limits.
        """
        any_changes = False
        new_nodes: Set[str] = set()

        for pid in playlist_ids:
            songs = cls._fetch_song_ids(pid, sp_client)
            changed = cls._add_or_update_playlist(pid, songs)
            any_changes |= changed
            new_nodes.update(songs)

        if any_changes:
            cls._retrain_node2vec()
        return any_changes

    @classmethod
    def playlist_similarity(cls, songs_a: Iterable[str], songs_b: Iterable[str]) -> float:
        """Cosine similarity between *two playlists* given their song IDs."""
        if cls.node2vec_model is None:
            print("Node2Vec model is not initialized.")
            return 0.0

        def _avg_vector(song_ids):
            vecs = [cls.node2vec_model.wv[s] for s in song_ids if s in cls.node2vec_model.wv]
            return np.mean(vecs, axis=0) if vecs else np.array([])

        vec_a = _avg_vector(songs_a)
        vec_b = _avg_vector(songs_b)

        if vec_a.size == 0 or vec_b.size == 0:
            print("One or both vectors are empty. Skipping similarity.")
            return 0.0

        try:
            return float(cosine_similarity([vec_a], [vec_b])[0][0])
        except Exception as e:
            print(f"Error computing cosine similarity: {e}")
            return 0.0

    @classmethod
    def export_graph(cls, min_edge_weight: int = 1) -> Dict[str, List[Dict]]:
        """Return a *nodes/links* dict ready for the React ForceGraph.

        *min_edge_weight* filters out weak connections to reduce payload size.
        """
        nodes = [
            {"id": n, "label": cls.song_metadata.get(n, n), "metadata": {}}
            for n in cls.G.nodes()
        ]
        links = [
            {"source": u, "target": v, "weight": d["weight"]}
            for u, v, d in cls.G.edges(data=True) if d["weight"] >= min_edge_weight
        ]
        return {"nodes": nodes, "links": links}

    # ---------------------------------------------------------------------
    # Persistence helpers
    # ---------------------------------------------------------------------

    @classmethod
    def save_state(cls, path: Path | str = STATE_FILE) -> None:
        data = {
            "co_occurrence": cls.co_occurrence,
            "playlist_data": cls.playlist_data,
            "playlist_hashes": cls.playlist_hashes,
            "song_metadata": cls.song_metadata,
            "graph": cls.G,
            "node2vec_model": cls.node2vec_model,
        }
        with open(path, "wb") as fh:
            pickle.dump(data, fh)

    @classmethod
    def load_state(cls, path: Path | str = STATE_FILE) -> None:
        if not Path(path).exists():
            return
        with open(path, "rb") as fh:
            data = pickle.load(fh)
        cls.co_occurrence = data["co_occurrence"]
        cls.playlist_data = data["playlist_data"]
        cls.playlist_hashes = data["playlist_hashes"]
        cls.song_metadata = data["song_metadata"]
        cls.G = data["graph"]
        cls.node2vec_model = data["node2vec_model"]

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------

    @classmethod
    def _fetch_song_ids(cls, playlist_id: str, sp_client) -> List[str]:
        """Return *all* track IDs for the playlist."""
        songs: List[str] = []
        offset, limit = 0, 100
        while True:
            results = sp_client.playlist_tracks(playlist_id, offset=offset, limit=limit)
            items = results.get("items", [])
            if not items:
                break
            for item in items:
                track = item.get("track")
                if track is None:
                    continue
                tid = track["id"]
                name = track["name"]
                artist = track["artists"][0]["name"]
                cls.song_metadata[tid] = f"{name} – {artist}"
                songs.append(tid)
            offset += limit
        return songs

    @classmethod
    def _add_or_update_playlist(cls, playlist_id: str, songs: List[str]) -> bool:
        """Update graph & co‑occurrence table. Return **True** if playlist changed."""
        song_set = set(songs)
        song_hash = _hash_songs(song_set)
        if playlist_id in cls.playlist_hashes and cls.playlist_hashes[playlist_id] == song_hash:
            return False  # no changes

        cls.playlist_data[playlist_id] = song_set
        cls.playlist_hashes[playlist_id] = song_hash

        for s1, s2 in combinations(sorted(song_set), 2):
            cls.co_occurrence[(s1, s2)] += 1
            cls.G.add_edge(s1, s2, weight=cls.co_occurrence[(s1, s2)])
        return True

    # TODO uncomment this after debugging - stops model training
    # @classmethod
    # def _retrain_node2vec(cls) -> None:
    #     if cls.G.number_of_nodes() == 0:
    #         return
    #     node2vec = Node2Vec(cls.G, dimensions=EMBEDDING_DIM, **NODE2VEC_KWARGS)
    #     cls.node2vec_model = node2vec.fit(window=5, min_count=1)

    @classmethod
    def _retrain_node2vec(cls) -> None:
        print("⚠️ Skipping Node2Vec retraining for debug.")
        cls.node2vec_model = None

# ---------------------------------------------------------------------------
# Convenience top‑level functions (optional re‑exports)
# ---------------------------------------------------------------------------

add_playlists = GraphService.add_playlists
playlist_similarity = GraphService.playlist_similarity
export_graph = GraphService.export_graph
save_state = GraphService.save_state
load_state = GraphService.load_state
reset_graph = lambda: GraphService.__dict__.update({
    "co_occurrence": defaultdict(int),
    "playlist_data": {},
    "playlist_hashes": {},
    "song_metadata": {},
    "G": nx.Graph(),
    "node2vec_model": None,
})
