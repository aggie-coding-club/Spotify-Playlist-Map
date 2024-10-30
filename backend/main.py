import requests
import urllib.parse

from datetime import datetime, timedelta
from flask import Flask, redirect, request, jsonify, session

app = Flask(__name__)
app.secret_key = '0cc529d1-69a3-443b-b6be-6073abba0313'

CLIENT_ID = '' #provided by spotify
CLIENT_SECRECT = '' #use your own client_secrect for this 
REDIRECT_URI = 'http://localhost:500/callback'

AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'
API_BASE_URL = 'https://api.spotify.com/v1/'

@app.route('/')
def index():
    return "Spotify playlist map <a href= '/login' > Login with Spotifty </a>"

@app.route('/login')
def login():
    scope = 'user-read-private user-read-email'

    parameters = {
        'client_id' : CLIENT_ID,
        'response_type' : 'code',
        'redirect_uri' : REDIRECT_URI,
        'scope' : scope,
        'show_dialog' : False 
    }

    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(parameters)}"
    print(f"Auth URL: {auth_url}")

    return redirect(auth_url)

#call back endpoint
@app.route('/callback') #If the user fails to login then the following will be called
def callback():
    if 'error' in request.args:
        return jsonify({"error" : request.args['errord']})

    if 'code' in request.args:
        req_body = {
            'code' : request.args['code'],
            'grant_type' : 'authorization_code',
            'redirect_uri' : REDIRECT_URI,
            'client_id' : CLIENT_ID,
            'client_secret' : CLIENT_SECRECT
        }

        response = requests.post(TOKEN_URL, data = req_body)
        token_info = response.json()

        session['access_token'] = token_info.get('access_token', None)
        session['refresh_token'] = token_info.get('refresh_token', None)
        session['expires_at'] = datetime.now().timestamp() + 10 #token_info.get('expires_in', 0) #time the token expires


        return redirect('/playlists')

@app.route('/playlists')
def get_playlists():
    if 'access_token' not in session: #check if the login was successful
        return redirect('/login')

    if datetime.now().timestamp() > session['expires_at']:
        return redirect('/refresh_token')

    headers = {
        'Authorization' : f"Bearer {session['access_token']}"
    }

    #response variable to store the result of making the request
    response = requests.get(API_BASE_URL + 'me/playlists', headers=headers)
    playlists = response.json()

    return jsonify(playlists)

@app.route('/refresh_token')
def refresh_token():
    if 'refresh_token' not in session: #check if the refresh token is returned previously if not then redirect the user back to the login page
        return redirect('/login')
    
    if datetime.now().timestamp() > session['expires_at']:
        req_body = {
            'grant_type' : 'refresh_token',
            'refresh_token' : session['refresh_token'],
            'client_id' : CLIENT_ID,
            'client_secret' : CLIENT_SECRECT
        }

        response = requests.post(TOKEN_URL, data=req_body)
        new_token_info = response.json()

        session['access_token'] = new_token_info['access_info']
        session['expires_at'] = datetime.now().timestamp() + 10
        return redirect('/playlists')

if __name__ == '__main__':
    app.run(host = '0.0.0.0', port =500, debug = True)
