import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide } from 'd3-force'; 
import { Paper, Title, Text, Stack, Group, Button, Input, Center } from '@mantine/core';
import { IconPlayerPause, IconPlayerPlay, IconPlayerTrackNext, IconPlayerTrackPrev } from '@tabler/icons-react';
import { IconSearch } from '@tabler/icons-react';
import { Carousel } from '@mantine/carousel';
import '@mantine/carousel/styles.css';

type SongNode = {
  id: string;
  title: string;
  artist: string;
  albumCover: string;
  x?: number;
  y?: number;
};

type SongLink = {
  source: string;
  target: string;
  distance: number;
};

interface MusicMapProps {
  nodes: SongNode[];
  links: SongLink[];
}

export const MusicMap: React.FC<MusicMapProps> = ({ nodes, links }) => {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });
  const [showMap, setShowMap] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'playlist' | 'song'>('playlist');

  // Keep all your existing useEffect hooks and other functions...

  const playlists = [
    { title: 'Graduation', owner: 'Kanye West', cover: 'https://m.media-amazon.com/images/I/71pxGj4RoVS.jpg' },
    { title: '808s & Heartbreak', owner: 'Kanye West', cover: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/808s_%26_Heartbreak.png/220px-808s_%26_Heartbreak.png' },
    { title: 'The College Dropout', owner: 'Kanye West', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/0d/73/b1/0d73b181-2716-f7a6-a340-0a3f81eacfb9/06UMGIM15686.rgb.jpg/600x600bf-60.jpg' },
  ];

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
          gap="xl"
          className='selection-stack'
        >
          <Group>
            <Button
              variant={selectedTab === 'playlist' ? 'filled' : 'outline'}
              color="blue"
              size="lg"
              radius="xl"
              onClick={() => setSelectedTab('playlist')}
            >
              Playlist
            </Button>

            <Button
              variant={selectedTab === 'song' ? 'filled' : 'outline'}
              color="blue"
              size="lg"
              radius="xl"
              onClick={() => setSelectedTab('song')}
            >
              Song
            </Button>
          </Group>

          {selectedTab === 'playlist' ? (
            <Center style={{ width: '100%', maxWidth: 500 }}>
              <Carousel
                withControls
                slideSize="70%"
                align="center"
                slideGap="md"
                loop
                controlsOffset="lg"
                controlSize={32}
              >
                {playlists.map((playlist, index) => (
                  <Carousel.Slide key={index} style={{ textAlign: 'center' }}>
                    <img
                      src={playlist.cover}
                      alt={`${playlist.title} cover`}
                      style={{ borderRadius: 8, width: '100%', marginBottom: 10 }}
                    />
                    <Text size="lg" fw={500} c="black">{playlist.title}</Text>
                    <Text size="sm" c="dimmed">{playlist.owner}</Text>
                  </Carousel.Slide>
                ))}
              </Carousel>
            </Center>
          ) : (
            <Stack align="center" gap="md" style={{ width: '100%', maxWidth: 1000}}>
              <Input
                placeholder="Enter Song Name"
                size="md"
                radius="xl"
                style={{ width: '100%', maxWidth: 400 }}
              />
            </Stack>
          )}

          <Button color="blue" size="lg" radius="xl" onClick={() => setShowMap(true)}>
            Go
          </Button>
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
              graphData={{ nodes, links }}
              nodeLabel={(node: SongNode) => `${node.title} by ${node.artist}`}
              nodeAutoColorBy="id"
              linkWidth={2}
              enableNodeDrag={false}
              nodeCanvasObject={(node: SongNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const img = imageCache[node.id];
                if (!img) return; 

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
};

export default MusicMap;