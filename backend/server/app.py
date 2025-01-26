from flask import Flask
from flask_cors import CORS
from spotify_auth import auth_bp 

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Spotify-Access-Token"]
    }
})

# randomly generated
app.secret_key = '0cc529d1-69a3-443b-b6be-6073abba0313'
app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)