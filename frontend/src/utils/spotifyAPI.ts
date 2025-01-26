import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Interface definitions
interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  jwtToken: string;
  userData: UserData;
}

interface UserData {
  id: string;
  display_name: string;
  email: string;
  // Add other user properties as needed
}

interface Playlist {
  id: string;
  name: string;
  // Add other playlist properties as needed
}

interface Track {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  // Add other track properties as needed
}

// API response types
interface AuthResponse {
  authUrl: string;
}

interface CallbackResponse extends SpotifyTokens {}

interface PlaylistsResponse {
  items: Playlist[];
}

interface TopTracksResponse {
  items: Track[];
}

interface PlaylistTracksResponse {
  items: Array<{
    track: Track;
  }>;
}

interface RecommendationsResponse {
  tracks: Track[];
}

// Create the API instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api/spotify',
  withCredentials: true
});

// Add request interceptor to add tokens to headers
api.interceptors.request.use((config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const jwtToken = localStorage.getItem('jwt_token');
  const spotifyToken = localStorage.getItem('spotify_access_token');
  
  if (jwtToken) {
    config.headers.Authorization = `Bearer ${jwtToken}`;
  }
  if (spotifyToken) {
    config.headers['Spotify-Access-Token'] = spotifyToken;
  }
  
  return config;
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        const response = await api.post<{ accessToken: string }>('/refresh', { refresh_token: refreshToken });
        
        localStorage.setItem('spotify_access_token', response.data.accessToken);
        
        return api(originalRequest);
      } catch (error) {
        // Refresh failed, redirect to login
        window.location.href = '/';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export const spotifyAPI = {
  async initiateLogin(): Promise<string> {
    const response = await api.get<AuthResponse>('/auth');
    return response.data.authUrl;
  },
  
  async handleCallback(code: string): Promise<UserData> {
    const response = await api.post<CallbackResponse>('/callback', { code });
    const { accessToken, refreshToken, jwtToken, userData } = response.data;
    
    // Store tokens
    localStorage.setItem('spotify_access_token', accessToken);
    localStorage.setItem('spotify_refresh_token', refreshToken);
    localStorage.setItem('jwt_token', jwtToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    return userData;
  },
  
  async getPlaylists(): Promise<Playlist[]> {
    const response = await api.get<PlaylistsResponse>('/playlists');
    return response.data.items;
  },
  
  async getTopTracks(timeRange: TimeRange = 'medium_term'): Promise<Track[]> {
    const response = await api.get<TopTracksResponse>('/top-tracks', {
      params: { time_range: timeRange }
    });
    // console.log(response);
    return response.data.items;
  },
  
  async getPlaylistTracks(playlistId: string): Promise<Array<{ track: Track }>> {
    const response = await api.get<PlaylistTracksResponse>(`/playlist/${playlistId}/tracks`);
    return response.data.items;
  },

  async getRecommendations({
    seed_tracks = [],
    seed_artists = [],
    seed_genres = [],
    limit = 5,
    market = 'US'
  }: {
    seed_tracks?: string[];
    seed_artists?: string[];
    seed_genres?: string[];
    limit?: number;
    market?: string;
  }): Promise<Track[]> {
    // Validate that at least one seed is provided
    if (!seed_tracks?.length && !seed_artists?.length && !seed_genres?.length) {
      throw new Error('At least one seed parameter is required');
    }
  
    const response = await api.get<RecommendationsResponse>('/recommendations', {
      params: {
        seed_tracks: seed_tracks?.join(','),
        seed_artists: seed_artists?.join(','),
        seed_genres: seed_genres?.join(','),
        limit,
        market
      }
    });
    
    console.log('API Response:', response.data);  // Add logging
    return response.data.tracks;
  }
};