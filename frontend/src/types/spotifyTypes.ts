// Types to be received from Spotify's API w/ the info we need

export type SpotifyTrack = {
  id: string; 
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  popularity: number;
  explicit: boolean;
  href: string;
}

export type SpotifyArtist = {
  id: string;
  name: string;
  followers: number;
  popularity: number;
  portrait: string;
}

export type SpotifyAlbum = {
  id: string;
  name: string;
  release_date: string; // YYYY-MM
  albumCover: string;
  num_tracks: number;
}

// Every time you call "get track" from the API, the response includes:
//    an album object 
//    an artists object
//    song details


export type SpotifyPlaylist = {
  id: string; 
  name: string; 
  description?: string; 
  owner: {
    id: string; 
    display_name: string; 
  };
  images: {
    url: string; 
    height?: number;
    width?: number; 
  }[];
  tracks: {
    total: number; 
    href: string;
    items?: {
      track: SpotifyTrack; 
    }[]; 
  };
  public?: boolean; 
  collaborative?: boolean; 
  external_urls?: {
    spotify: string; 
  };
};

