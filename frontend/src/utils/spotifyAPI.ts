import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { SpotifyPlaylist, SpotifyTrack } from '../types/spotifyTypes';

// Interface definitions (keep only auth-related types)
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
}

// API response types (modified to use imported types)
interface AuthResponse {
  authUrl: string;
}

interface CallbackResponse extends SpotifyTokens {}

interface PlaylistsResponse {
  items: SpotifyPlaylist[];
}

interface TopTracksResponse {
  items: SpotifyTrack[];
}

interface PlaylistTracksResponse {
  items: Array<{
    track: SpotifyTrack;
  }>;
}

// Create the API instance (unchanged)
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api/spotify',
  withCredentials: true
});

// Add request interceptor (unchanged)
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

// Add response interceptor (unchanged)
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
    
    localStorage.setItem('spotify_access_token', accessToken);
    localStorage.setItem('spotify_refresh_token', refreshToken);
    localStorage.setItem('jwt_token', jwtToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    return userData;
  },
  
  async getPlaylists(): Promise<SpotifyPlaylist[]> {
    const response = await api.get<PlaylistsResponse>('/playlists');
    return response.data.items;
  },
  
  async getTopTracks(timeRange: TimeRange = 'medium_term'): Promise<SpotifyTrack[]> {
    const response = await api.get<TopTracksResponse>('/top-tracks', {
      params: { time_range: timeRange }
    });
    return response.data.items;
  },
  
  async getPlaylistTracks(playlistId: string): Promise<Array<{ track: SpotifyTrack }>> {
    const response = await api.get<PlaylistTracksResponse>(`/playlist/${playlistId}/tracks`);
    return response.data.items;
  },
};