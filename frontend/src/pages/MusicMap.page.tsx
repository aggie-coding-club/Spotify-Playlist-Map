import { useRef, useState } from 'react';
import { Paper, Title, Text, Stack, Group, Button } from '@mantine/core';
import { IconPlayerPause, IconPlayerPlay, IconPlayerTrackNext, IconPlayerTrackPrev } from '@tabler/icons-react';
import { Node, GraphData } from '../types/reactForceGraphTypes';
import { SpotifyPlaylist } from '../types/spotifyTypes';
import ForceGraph from '../components/ForceGraph/ForceGraph'

export function MusicMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  // const [artistPreview, setArtist] = useState("-");


  // Hardcoded playlists for carousel (original implementation)
  const hardcodedPlaylists: SpotifyPlaylist[] = [
    {
      id: '1',
      name: 'My Favorite Tracks',
      images: [{ url: 'https://via.placeholder.com/300' }],
      tracks: { 
        total: 20,
        href: '',
        items: [] 
      },
      owner: { 
        display_name: 'User', 
        id: '1' 
      },
      public: true,
      collaborative: false,
      description: 'Best tracks collection',
      external_urls: { spotify: '' }
    },
    {
      id: '2',
      name: 'Summer Hits',
      images: [{ url: 'https://via.placeholder.com/300' }],
      tracks: { 
        total: 15,
        href: '',
        items: [] 
      },
      owner: { 
        display_name: 'User', 
        id: '1' 
      },
      public: true,
      collaborative: false,
      description: 'Hot summer tracks',
      external_urls: { spotify: '' }
    }
  ];


  // Hardcoded graph data
  const mockGraphData: GraphData = {
    nodes: [
      {
        id: '1',
        label: 'Sample Track 1',
        image: 'https://picsum.photos/400',
        metadata: { artist: 'Artist 1', genre: 'Pop' }
      },
      {
        id: '2',
        label: 'Sample Track 2',
        image: 'https://picsum.photos/400',
        metadata: { artist: 'Artist 2', genre: 'Rock' }
      },
      {
        id: '3',
        label: 'Sample Track 3',
        image: 'https://picsum.photos/400',
        metadata: { artist: 'Artist 2', genre: 'Rap' }
      },
      {
        id: '4',
        label: 'Sample Track 4',
        image: 'https://picsum.photos/400',
        metadata: { artist: 'Artist 3', genre: 'Jazz' }
      },
      {
        id: '5',
        label: 'Sample Track 5',
        image: 'https://picsum.photos/400',
        metadata: { artist: 'Artist 4', genre: 'Indie' }
      },
      {
        id: '6',
        label: 'Sample Track 6',
        image: 'https://picsum.photos/400',
        metadata: { artist: 'Artist 5', genre: 'House' }
      }


    ],
    links: [
      { source: '1', target: '2', weight: 0.85 },
      { source: '2', target: '3', weight: 0.01 },
      { source: '3', target: '2', weight: 0.2 },
      { source: '4', target: '3', weight: 0.5 },
      { source: '5', target: '4', weight: 0.5 },
      { source: '6', target: '5', weight: 0.5 },
      { source: '5', target: '3', weight: 0.5 },
      { source: '1', target: '3', weight: 0.5 },
      { source: '1', target: '5', weight: 0.5 }
    ]

  };


  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%',
        height: 'calc(100vh - 3.75rem)', // This code assumes the header's height will always be 60px
        backgroundColor: 'var(--mantine-color-gray-1)', 
        padding: '1rem',
        display: 'flex',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      
        <>
          <Paper radius='lg' shadow='lg' style={{ width: '80%', height: '100%', overflow: 'hidden' }}>
            <ForceGraph graphData={mockGraphData} onNodeClick={setSelectedNode}/>
          </Paper>

          <Stack style={{ width: '20%' }} gap='md'>
            <Paper radius='lg' shadow="lg" p="md" style={{ flex: 1 }}>
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

            <Paper radius='lg' shadow="lg" p="md" style={{ flex: 3 }}>
              <Title order={4} mb="md">Music Details</Title>
              <Stack gap="md">
                <div>
                  <Text fw={500} size="sm">Selected Song</Text>
                  <Text size="sm" c="dimmed">{selectedNode?.label ?? 'Click a node!'}</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Artists</Text>
                  <Text size="sm" c="dimmed">{selectedNode?.metadata?.artist ?? '-'}</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Album</Text>
                  <Text size="sm" c="dimmed">-</Text>
                </div>
                <div>
                  <Text fw={500} size="sm">Genre</Text>
                  <Text size="sm" c="dimmed">{selectedNode?.metadata?.genre ?? '-'}</Text>
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
    </div>
  );
}
