import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide } from 'd3-force'; 
import { Paper, Title, Text, Stack, Group, Button, Input, Center, Loader } from '@mantine/core';
import { IconPlayerPause, IconPlayerPlay, IconPlayerTrackNext, IconPlayerTrackPrev } from '@tabler/icons-react';
import { Carousel } from '@mantine/carousel';
import '@mantine/carousel/styles.css';
import { spotifyAPI } from '../utils/spotifyAPI'; 

// Comprehensive Spotify API Types
export interface SpotifyImage {
  url: string;
  height?: number | null;
  width?: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls?: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date?: string;
  total_tracks?: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms?: number;
  external_urls?: {
    spotify: string;
  };
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[];
}

export interface SpotifyPlaylistTrackItem {
  track: SpotifyTrack;
}

// Visualization-specific types
export type SongNode = {
  id: string;
  title: string;
  artist: string;
  albumCover?: string;
  x?: number;
  y?: number;
};

export type SongLink = {
  source: string;
  target: string;
  distance: number;
};

export interface SpotifyPlaylist {
  id: string;
  name: string;
  owner: {
    display_name: string;
    id: string;
  };
  images: SpotifyImage[];
  tracks: {
    href: string;
    total: number;
  };
  public?: boolean;
  collaborative?: boolean;
  description?: string;
  external_urls?: {
    spotify: string;
  };
}





export function MusicMap() {
  // Refs and state
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for playlists and map
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Visualization states
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });
  const [showMap, setShowMap] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'playlist' | 'song'>('playlist');

  // Recommendation graph states
  const [graphData, setGraphData] = useState<{
    nodes: SongNode[];
    links: SongLink[];
  }>({ nodes: [], links: [] });
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  // Music player states
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate recommendation graph
  const generateRecommendationGraph = async (playlistId: string) => {
    try {
      setRecommendationLoading(true);
      
      // Fetch playlist tracks
      const playlistTracks = await spotifyAPI.getPlaylistTracks(playlistId);
      
      // Ensure we have tracks and the first track exists
      if (!playlistTracks || playlistTracks.length === 0) {
        throw new Error('No tracks found in the playlist');
      }
  
      // Get the first track as the root
      const rootTrack = playlistTracks[0].track;
      console.log(rootTrack);
      
      // Validate rootTrack
      if (!rootTrack) {
        throw new Error('Could not find a valid track in the playlist');
      }
  
      // Get recommendations 
      const recommendations = await spotifyAPI.getRecommendations({
        seed_tracks: [rootTrack.id],
        limit: 5
      });
      
      console.log('Raw recommendations:', recommendations);

      // Check if recommendations is an array
      if (!Array.isArray(recommendations)) {
        console.error('Expected an array of recommendations, but received:', recommendations);
        return; // Exit the function or handle the error appropriately
      }

      // Process the tracks
      const recommendationGraph = recommendations.map((track) => {
        console.log('Processing track:', track.name);
        // Process each track for the recommendation graph
      });
  
      // Type assertion or type guard
      const recommendationsResponse: SpotifyRecommendationsResponse = {
        tracks: recommendations as SpotifyTrack[]
      };
  
      // Prepare nodes with safe property access using optional chaining
      const nodes: SongNode[] = [
        {
          id: rootTrack.id,
          title: rootTrack.name,
          artist: rootTrack.artists?.[0]?.name || 'Unknown Artist',
          // Use type assertion or a more defensive approach
          albumCover: (rootTrack as any).album?.images?.[0]?.url || 'https://via.placeholder.com/300'
        },
        ...recommendationsResponse.tracks.map(track => ({
          id: track.id,
          title: track.name,
          artist: track.artists?.[0]?.name || 'Unknown Artist',
          albumCover: track.album?.images?.[0]?.url || 'https://via.placeholder.com/300'
        }))
      ];
  
      // Prepare links
      const links: SongLink[] = recommendationsResponse.tracks.map(track => ({
        source: rootTrack.id,
        target: track.id,
        distance: 100
      }));
      
      // console.log("generated graph data: ", {nodes, links})
      setGraphData({ nodes, links });
      setShowMap(true);
      setRecommendationLoading(false);
    } catch (error) {
      console.error('Failed to generate recommendation graph', error);
      setRecommendationLoading(false);
      setError(`Failed to generate recommendation graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Existing effects (fetch playlists, dimensions, etc.)
  useEffect(() => {
    async function fetchPlaylists() {
      try {
        setIsLoading(true);
        const fetchedPlaylists = await spotifyAPI.getPlaylists();
        
        const transformedPlaylists = (fetchedPlaylists as any[]).map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          owner: { 
            display_name: playlist.owner?.display_name || 'Unknown',
            id: playlist.owner?.id || '' // Add the missing 'id' property
          },
          images: playlist.images || [],
          tracks: { 
            total: playlist.tracks?.total || 0,
            href: playlist.tracks?.href || '' // Add href if it's in your SpotifyPlaylist interface
          },
          // Add other optional properties if they exist in your SpotifyPlaylist interface
          public: playlist.public,
          collaborative: playlist.collaborative,
          description: playlist.description,
          external_urls: playlist.external_urls
        }));
        
        setPlaylists(transformedPlaylists);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch playlists');
        setIsLoading(false);
        console.error(err);
      }
    }

    const spotifyAccessToken = localStorage.getItem('spotify_access_token');
    if (spotifyAccessToken) {
      fetchPlaylists();
    }
  }, []);

  // Dimension tracking effect
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth * 0.8,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Loading and error states
  if (isLoading || recommendationLoading) {
    return (
      <Center style={{ height: 'calc(100vh - var(--mantine-header-height, 103px))' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ height: 'calc(100vh - var(--mantine-header-height, 103px))' }}>
        <Text color="red">{error}</Text>
      </Center>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%',
        height: 'calc(100vh - var(--mantine-header-height, 103px))',
        backgroundColor: 'var(--mantine-color-gray-1)', 
        padding: '0.5rem',
        display: 'flex',
        gap: '0.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!showMap ? (
        // Selection screen
        <Stack
          bg="var(--mantine-color-body)"
          style={{ color: 'white', padding: '20px', width: '100%' }}
          justify='space-around'
          align='center'
          gap="xs"
          className='selection-stack'
        >
          <Carousel
            withControls
            slideSize="50%"
            align="center"
            slideGap="xs" 
            slidesToScroll={1}
            loop
            controlsOffset="xs"
            controlSize={32}
            height="30rem"
            style={{ 
              width: '40%', 
              margin: '0 auto' 
            }}
          >
            {playlists.map((playlist) => (
              <Carousel.Slide 
                key={playlist.id} 
                style={{ textAlign: 'center', padding: '0 5px' }}
                onClick={() => generateRecommendationGraph(playlist.id)}
              >
                <div style={{ height: '30rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={playlist.images?.[0]?.url || 'https://via.placeholder.com/300'}
                    alt={`${playlist.name} cover`}
                    style={{ 
                      borderRadius: 8,
                      height: '20rem', 
                      width: '100%',
                      objectFit: 'contain',
                      marginBottom: 10
                    }}
                  />
                  <Text size="lg" fw={500} c="black">{playlist.name}</Text>
                  <Text size="sm" c="dimmed">
                    {playlist.tracks.total} tracks
                  </Text>
                </div>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Stack>
      ) : (
        // Map and controls view
        <>
          <Paper 
            style={{ 
              width: '80%', 
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <ForceGraph2D
              width={dimensions.width}
              height={dimensions.height}
              ref={fgRef}
              graphData={graphData}
              nodeLabel={(node: SongNode) => `${node.title} by ${node.artist}`}
              nodeAutoColorBy="id"
              linkWidth={2}
              enableNodeDrag={false}
              nodeCanvasObject={(node: SongNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const img = new Image();
                img.src = node.albumCover ?? 'https://via.placeholder.com/300'; // Use default value
                const size = 40 / globalScale; 
                ctx.save();
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, size / 2, 0, 2 * Math.PI, false); 
                ctx.clip();
                ctx.drawImage(img, node.x! - size / 2, node.y! - size / 2, size, size);
                ctx.restore();

                ctx.font = `${12 / globalScale}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.fillStyle = 'black';
                ctx.fillText(node.title, node.x!, node.y! - size / 2 - 5);
              }}
              nodePointerAreaPaint={(node: SongNode, color: string, ctx: CanvasRenderingContext2D) => {
                const size = 40;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, size / 2, 0, 2 * Math.PI, false);
                ctx.fill();
              }}
            />
          </Paper>

          <Stack style={{ width: '20%' }} gap="md">
            <Paper shadow="sm" p="md" style={{ flex: 1 }}>
              <Title order={4} mb="md">Music Player</Title>
              <Stack gap="md">
                <div style={{
                  width: '20%',
                  aspectRatio: '1',
                  backgroundColor: 'var(--mantine-color-gray-1)',
                  borderRadius: 'var(--mantine-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text c="dimmed" size="xs">Album Art</Text>
                </div>
                
                <div>
                  <div style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: 'var(--mantine-color-gray-2)',
                    borderRadius: '2px',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      height: '100%',
                      width: '33%',
                      backgroundColor: 'var(--mantine-color-blue-6)',
                      borderRadius: '2px'
                    }} />
                  </div>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">1:23</Text>
                    <Text size="xs" c="dimmed">3:45</Text>
                  </Group>
                </div>
                
                <Group justify="center" gap="md">
                  <Button variant="subtle" p="xs" style={{ borderRadius: '50%' }}>
                    <IconPlayerTrackPrev size={20} />
                  </Button>
                  <Button 
                    variant="subtle" 
                    p="xs" 
                    style={{ borderRadius: '50%' }}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
                  </Button>
                  <Button variant="subtle" p="xs" style={{ borderRadius: '50%' }}>
                    <IconPlayerTrackNext size={20} />
                  </Button>
                </Group>
              </Stack>
            </Paper>

            <Paper shadow="sm" p="md" style={{ flex: 3 }}>
              <Title order={4} mb="md">Music Details</Title>
              <Stack gap="md">
                <div>
                  <Text fw={500} size="sm">Selected Song</Text>
                  <Text size="sm" c="dimmed">Click a node to view details</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Artist</Text>
                  <Text size="sm" c="dimmed">-</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Album</Text>
                  <Text size="sm" c="dimmed">-</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Genre</Text>
                  <Text size="sm" c="dimmed">-</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Release Date</Text>
                  <Text size="sm" c="dimmed">-</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Duration</Text>
                  <Text size="sm" c="dimmed">-</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Connected Songs</Text>
                  <Text size="sm" c="dimmed">-</Text>
                </div>
              </Stack>
            </Paper>
          </Stack>
        </>
      )}
    </div>
  );
}

export default MusicMap;







