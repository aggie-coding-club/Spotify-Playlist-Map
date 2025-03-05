import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Paper, Title, Text, Stack, Group, Button, Center } from '@mantine/core';
import { IconPlayerPause, IconPlayerPlay, IconPlayerTrackNext, IconPlayerTrackPrev } from '@tabler/icons-react';
import { Carousel } from '@mantine/carousel';
import '@mantine/carousel/styles.css';
import { Node, Link, GraphData } from '../types/reactForceGraphTypes';
import { SpotifyPlaylist } from '../types/spotifyTypes';

export function MusicMap() {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMap, setShowMap] = useState(false);

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
        image: 'https://placehold.co/600x400',
        metadata: { artist: 'Artist 1', genre: 'Pop' }
      },
      {
        id: '2',
        label: 'Sample Track 2',
        image: 'https://placehold.co/600x400',
        metadata: { artist: 'Artist 2', genre: 'Rock' }
      },
      {
        id: '3',
        label: 'Sample Track 3',
        image: 'https://placehold.co/600x400',
        metadata: { artist: 'Artist 2', genre: 'Rap' }
      },
      {
        id: '4',
        label: 'Sample Track 4',
        image: 'https://placehold.co/600x400',
        metadata: { artist: 'Artist 3', genre: 'Jazz' }
      },
      {
        id: '5',
        label: 'Sample Track 5',
        image: 'https://placehold.co/600x400',
        metadata: { artist: 'Artist 4', genre: 'Indie' }
      },
      {
        id: '6',
        label: 'Sample Track 5',
        image: 'https://placehold.co/600x400',
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
      { source: '1', target: '3', weight: 0.5 }
    ]

  };

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
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
      
        <>
          <Paper style={{ width: '80%', height: '100%', overflow: 'hidden' }}>
            <ForceGraph2D
              width={dimensions.width}
              height={dimensions.height}
              ref={fgRef}
              graphData={mockGraphData}
              nodeLabel={(node: Node) => `${node.label}`}
              nodeAutoColorBy="id"
              linkWidth={2}
              enableNodeDrag={false}
              nodeCanvasObject={(node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const img = new Image();
                img.src = node.image ?? 'https://placehold.co/600x400';
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
                ctx.fillText(node.label, node.x!, node.y! - size / 2 - 5);
              }}
              nodePointerAreaPaint={(node: Node, color: string, ctx: CanvasRenderingContext2D) => {
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
    </div>
  );
}
