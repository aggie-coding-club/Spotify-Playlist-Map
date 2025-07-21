from flask import Blueprint, request, jsonify
from graph_service import GraphService, load_state, save_state
import json
import os
import requests
from spotify_auth import token_required

graph_bp = Blueprint('graph', __name__)

# Load the pre-existing playlist data
DATASET_PATH = os.getenv("AGGREGATED_PLAYLISTS_PATH", "aggregated_playlists.json")

def load_dataset():
    """Load the pre-aggregated playlist dataset"""
    try:
        with open(DATASET_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return []

# Try to load existing graph state on startup
try:
    load_state()
    print("Successfully loaded existing graph state")
except Exception as e:
    print(f"Could not load existing graph state: {e}")
    print("Starting with a fresh graph")

@graph_bp.route('/api/graph/recommendations', methods=['GET', 'OPTIONS'])
def get_recommendations():
    if request.method == 'OPTIONS':
        return '', 204
    
    # For GET requests, call the token-protected function
    return handle_get_recommendations()

@token_required
def handle_get_recommendations():
    print("Function started")  # debugging TODO delete
    spotify_token = request.headers.get('Spotify-Access-Token')
    playlist_id = request.args.get('playlist_id')

    print(f"Token received: {spotify_token is not None}, Playlist ID: {playlist_id}") # debugging TODO delete
    
    if not spotify_token:
        return jsonify({'message': 'Spotify token is missing'}), 401
        
    if not playlist_id:
        return jsonify({'message': 'Playlist ID is required'}), 400
    
    try:
        print(f"Processing recommendations for playlist: {playlist_id}")
        
        # Step 1: Fetch the tracks from the given playlist
        print("About to fetch tracks from Spotify")  # debugging TODO delete
        response = requests.get(
            f'https://api.spotify.com/v1/playlists/{playlist_id}/tracks',
            headers={'Authorization': f'Bearer {spotify_token}'},
            params={'fields': 'items(track(id,name,artists,album))'}
        )
        print(f"Spotify response status: {response.status_code}")  # debugging TODO delete
        response.raise_for_status()
        playlist_data = response.json()
        print(f"Playlist data keys: {playlist_data.keys()}")  # debugging TODO delete
        
        # Extract track IDs and metadata from playlist
        user_track_ids = []
        track_metadata = {}
        
        for item in playlist_data.get('items', []):
            if item.get('track') and item['track'].get('id'):
                track = item['track']
                track_id = track['id']
                user_track_ids.append(track_id)
                
                # Store metadata for visualization
                artist_name = track['artists'][0]['name'] if track['artists'] else 'Unknown Artist'
                track_metadata[track_id] = {
                    'name': track['name'],
                    'artist': artist_name,
                    'image': track['album']['images'][0]['url'] if track['album'].get('images') and len(track['album']['images']) > 0 else None
                }
                
                # Add to GraphService metadata
                GraphService.song_metadata[track_id] = f"{track['name']} – {artist_name}"
                
        if not user_track_ids:
            return jsonify({'message': 'No tracks found in playlist'}), 400
            
        # Step 2: Load the dataset of playlists
        dataset = load_dataset()
        print(f"Loaded dataset with {len(dataset)} playlists")
        
        class MockSpClient:
            def __init__(self, dataset):
                self.dataset = {pl['playlist_id']: pl for pl in dataset}
                
            def playlist_tracks(self, playlist_id, offset=0, limit=100):
                if playlist_id not in self.dataset:
                    return {"items": []}
                    
                playlist = self.dataset[playlist_id]
                tracks = playlist.get("tracks", [])
                items = []
                for track in tracks[offset:offset+limit]:
                    if not track.get("track_id"):
                        continue  # skip tracks without valid ID

                    items.append({
                        "track": {
                            "id": track["track_id"],
                            "name": track["track_name"],
                            "artists": [{"name": track["artist_name"]}]
                        }
                    })
                return {"items": items}
        
        # Add dataset playlists to graph service
        mock_client = MockSpClient(dataset)
        dataset_playlist_ids = [pl['playlist_id'] for pl in dataset]
        print(f"Adding {len(dataset_playlist_ids)} playlists to graph")
        GraphService.add_playlists(dataset_playlist_ids, mock_client)
        
        # Step 3: Calculate similarities and find recommendations
        print("Calculating song similarities")
        song_scores = {}
        
        # For each track in the user's playlist
        for track_id in user_track_ids:
            # Check connections to other songs in the graph
            if track_id in GraphService.G:
                for neighbor, edge_data in GraphService.G[track_id].items():
                    if neighbor not in user_track_ids:  # Avoid recommending songs already in playlist
                        weight = edge_data.get('weight', 0)
                        song_scores[neighbor] = song_scores.get(neighbor, 0) + weight
        
        # Sort by score and get top recommendations
        recommendations = sorted(song_scores.items(), key=lambda x: x[1], reverse=True)[:10]
        recommendation_ids = [rec[0] for rec in recommendations]
        print(f"Found {len(recommendation_ids)} recommendations")
        
        # Step 4: Get additional metadata for recommendations from Spotify API
        if recommendation_ids:
            # Split into chunks of 50 (Spotify API limit)
            chunks = [recommendation_ids[i:i+50] for i in range(0, len(recommendation_ids), 50)]
            
            for chunk in chunks:
                try:
                    tracks_response = requests.get(
                        f'https://api.spotify.com/v1/tracks',
                        headers={'Authorization': f'Bearer {spotify_token}'},
                        params={'ids': ','.join(chunk)}
                    )
                    tracks_response.raise_for_status()
                    tracks_data = tracks_response.json()
                    
                    for track in tracks_data.get('tracks', []):
                        track_id = track['id']
                        artist_name = track['artists'][0]['name'] if track['artists'] else 'Unknown Artist'
                        track_metadata[track_id] = {
                            'name': track['name'],
                            'artist': artist_name,
                            'image': track['album']['images'][0]['url'] if track['album'].get('images') and len(track['album']['images']) > 0 else None
                        }
                except Exception as e:
                    print(f"Error fetching track metadata: {e}")
                    # Continue with basic metadata we have from GraphService
        
        # Step 5: Build graph visualization data
        nodes = []
        
        # Add user's playlist tracks (blue)
        for track_id in user_track_ids:
            meta = track_metadata.get(track_id, {})
            nodes.append({
                "id": track_id,
                "label": meta.get('name', GraphService.song_metadata.get(track_id, "Unknown")),
                "image": meta.get('image'),
                "metadata": {
                    "artist": meta.get('artist', "Unknown Artist"),
                    "group": "user"
                }
            })
        
        # Add recommendation tracks (green)
        for track_id in recommendation_ids:
            meta = track_metadata.get(track_id, {})
            song_name = meta.get('name')
            
            if not song_name and track_id in GraphService.song_metadata:
                # Fall back to graph service metadata
                parts = GraphService.song_metadata[track_id].split(" – ", 1)
                song_name = parts[0] if len(parts) > 0 else "Unknown"
                artist_name = parts[1] if len(parts) > 1 else "Unknown Artist"
                meta['artist'] = artist_name
            
            nodes.append({
                "id": track_id,
                "label": song_name or "Unknown",
                "image": meta.get('image'),
                "metadata": {
                    "artist": meta.get('artist', "Unknown Artist"),
                    "group": "recommendation"
                }
            })
        
        # Create edges for visualization
        subgraph = GraphService.G.subgraph(user_track_ids + recommendation_ids)
        links = []
        
        for u, v, data in subgraph.edges(data=True):
            # Only include edges with weight > 0
            if data.get("weight", 0) > 0:
                links.append({
                    "source": u,
                    "target": v,
                    "weight": data.get("weight", 1),
                })
        
        # Save the updated graph state
        save_state()
        
        # Format recommendation data for frontend
        recommendation_data = []
        for song_id, score in recommendations:
            meta = track_metadata.get(song_id, {})
            song_name = meta.get('name')
            artist_name = meta.get('artist')
            
            if not song_name and song_id in GraphService.song_metadata:
                # Fall back to graph service metadata
                parts = GraphService.song_metadata[song_id].split(" – ", 1)
                song_name = parts[0] if len(parts) > 0 else "Unknown"
                artist_name = parts[1] if len(parts) > 1 else "Unknown Artist"
            
            recommendation_data.append({
                "id": song_id,
                "name": song_name or "Unknown",
                "artist": artist_name or "Unknown Artist",
                "score": score
            })
        
        print(f"Returning {len(nodes)} nodes and {len(links)} links")
        return jsonify({
            "recommendations": recommendation_data,
            "graphData": {
                "nodes": nodes,
                "links": links
            }
        })
        
    except Exception as e:
        print(f"Error processing graph recommendations: {e}")
        return jsonify({'error': str(e)}), 500