import requests
import urllib.parse
import datetime
import json
from functools import wraps
from flask import Blueprint, redirect, request, jsonify
import jwt
from dotenv import load_dotenv
import os

auth_bp = Blueprint('auth', __name__)

# Access the variables using os.getenv()
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
FRONTEND_URI = os.getenv("FRONTEND_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Spotify API endpoints
AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'
API_BASE_URL = 'https://api.spotify.com/v1/'

def token_required(f):
    """
    Decorator to check for valid JWT token in request headers
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
            
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated

def create_jwt_token(user_id):
    """
    Generates a JWT token for the user
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

@auth_bp.route('/api/spotify/auth', methods=['GET'])
def get_auth_url():
    """
    Returns the Spotify authentication URL
    """
    scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-library-read'
    parameters = {
        'client_id': CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': REDIRECT_URI,
        'scope': scope,
        'show_dialog': True
    }
    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(parameters)}"
    return jsonify({'authUrl': auth_url})

@auth_bp.route('/callback')
def callback():
    """
    Handles the callback from Spotify after user authentication
    """
    error = request.args.get('error')
    code = request.args.get('code')
    
    if error:
        return redirect(f'{FRONTEND_URI}/callback?error={error}')
        
    if not code:
        return redirect(f'{FRONTEND_URI}/callback?error=no_code')
    
    try:
        token_response = requests.post(
            TOKEN_URL,
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': REDIRECT_URI,
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET
            }
        )
        token_response.raise_for_status()
        token_info = token_response.json()

        user_response = requests.get(
            API_BASE_URL + 'me', 
            headers={'Authorization': f"Bearer {token_info['access_token']}"}
        )
        user_response.raise_for_status()
        user_data = user_response.json()

        jwt_token = create_jwt_token(user_data['id'])
        
        params = {
            'access_token': token_info['access_token'],
            'refresh_token': token_info['refresh_token'],
            'jwt_token': jwt_token,
            'user_data': urllib.parse.quote(json.dumps(user_data))
        }
        
        return redirect(f"{FRONTEND_URI}/callback?{urllib.parse.urlencode(params)}")

    except Exception as e:
        return redirect(f'{FRONTEND_URI}/callback?error={urllib.parse.quote(str(e))}')

@auth_bp.route('/api/spotify/playlists', methods=['GET', 'OPTIONS'])
def get_playlists():
    """
    Fetches playlists for the authenticated user
    """
    
    if request.method == 'OPTIONS':
        return '', 204
        
    @token_required
    def handle_get():
        spotify_token = request.headers.get('Spotify-Access-Token')
        if not spotify_token:
            return jsonify({'message': 'Spotify token is missing'}), 401
            
        try:
            response = requests.get(
                f'{API_BASE_URL}me/playlists',
                headers={'Authorization': f'Bearer {spotify_token}'}
            )
            response.raise_for_status()
            return jsonify(response.json())
        except requests.exceptions.RequestException as e:
            return jsonify({'error': str(e)}), 400
            
    return handle_get()

@auth_bp.route('/api/spotify/top-tracks', methods=['GET', 'OPTIONS'])
def get_top_tracks():
    """
    Fetches top tracks for the authenticated user
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    @token_required
    def handle_get():
        spotify_token = request.headers.get('Spotify-Access-Token')
        time_range = request.args.get('time_range', 'medium_term')
        
        if not spotify_token:
            return jsonify({'message': 'Spotify token is missing'}), 401
            
        try:
            response = requests.get(
                f'{API_BASE_URL}me/top/tracks',
                headers={'Authorization': f'Bearer {spotify_token}'},
                params={
                    'time_range': time_range,
                    'limit': 50
                }
            )
            response.raise_for_status()
            return jsonify(response.json())
        except requests.exceptions.RequestException as e:
            return jsonify({'error': str(e)}), 400
            
    return handle_get()

@auth_bp.route('/api/spotify/playlist/<playlist_id>/tracks', methods=['GET', 'OPTIONS'])
def get_playlist_tracks(playlist_id):
    """
    Fetches tracks from a specific playlist
    """
    if request.method == 'OPTIONS':
        return '', 204
        
    @token_required
    def handle_get():
        spotify_token = request.headers.get('Spotify-Access-Token')
        if not spotify_token:
            return jsonify({'message': 'Spotify token is missing'}), 401
            
        try:
            response = requests.get(
                f'{API_BASE_URL}playlists/{playlist_id}/tracks',
                headers={'Authorization': f'Bearer {spotify_token}'}
            )
            response.raise_for_status()
            return jsonify(response.json())
        except requests.exceptions.RequestException as e:
            return jsonify({'error': str(e)}), 400
            
    return handle_get()

@auth_bp.route('/api/spotify/recommendations', methods=['GET', 'OPTIONS'])
def get_recommendations():

    # TODO delete after testing
    # Handle OPTIONS request first

    print("DEBUGGING: Route hit!", flush=True)
    print(f"Method: {request.method}", flush=True)

    if request.method == 'OPTIONS':
        # Return empty response with 200 status for preflight
        response = jsonify({})
        return response, 200

    @token_required
    def handle_get():
        # TODO delete after testing
        print("=== Recommendation Request Debug ===")
        print("All request args:", dict(request.args))
        print("Headers:", dict(request.headers))
        
        spotify_token = request.headers.get('Spotify-Access-Token')
        
        # Log parameters before making Spotify API call
        seed_tracks = request.args.get('seed_tracks', '')
        seed_artists = request.args.get('seed_artists', '')
        seed_genres = request.args.get('seed_genres', '')
        limit = request.args.get('limit', 5)
        market = request.args.get('market', 'US')
        
        # TODO delete after testing
        print("\nProcessed Parameters:")
        print(f"Seed Tracks: '{seed_tracks}'")
        print(f"Seed Artists: '{seed_artists}'")
        print(f"Seed Genres: '{seed_genres}'")
        print(f"Limit: '{limit}'")
        print(f"Market: '{market}'")
        
        try:
            params = {
                'limit': limit,
                'market': market
            }
            
            if seed_tracks:
                params['seed_tracks'] = seed_tracks
            if seed_artists:
                params['seed_artists'] = seed_artists
            if seed_genres:
                params['seed_genres'] = seed_genres
                
            print("\nFinal Request Parameters:")
            print("URL:", f'{API_BASE_URL}recommendations')
            print("Params:", params)
            
            response = requests.get(
                f'{API_BASE_URL}recommendations',
                headers={'Authorization': f'Bearer {spotify_token}'},
                params=params
            )
            
            print("\nSpotify API Response:")
            print("Status Code:", response.status_code)
            print("Response:", response.text)
            
            response.raise_for_status()
            return jsonify(response.json())
        except requests.exceptions.RequestException as e:
            print("\nError occurred:")
            print(str(e))
            return jsonify({'error': str(e)}), 400
            
    return handle_get()