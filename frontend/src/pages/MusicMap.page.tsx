import { useRef, useState, useEffect } from 'react';
import {
  Paper,
  Text,
  Stack,
  Button,
  Loader,
  Center,
  ScrollArea,
  Card,
  Image,
  Select,
  Alert,
  Group,
  Tabs,
} from '@mantine/core';

import { Node, GraphData } from '../types/reactForceGraphTypes';
import { SpotifyPlaylist } from '../types/spotifyTypes';
import { spotifyAPI } from '../utils/spotifyAPI';

import ForceGraph from '../components/ForceGraph/ForceGraph';

export function MusicMap() {
  /* ─────────────── Graph state ─────────────── */
  const [showGraph, setShowGraph] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);

  /* ─────────────── Playlist picker state ─────────────── */
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [playlistErr, setPlaylistErr] = useState<string | null>(null);
  const [selectedPl, setSelectedPl] = useState<SpotifyPlaylist | null>(() => {
    const cached = localStorage.getItem('selected_playlist');
    return cached ? (JSON.parse(cached) as SpotifyPlaylist) : null;
  });
  
  /* ─────────────── Recommendations state ─────────────── */
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('tracks');
  const [analysisType, setAnalysisType] = useState<'regular' | 'recommendations'>('regular');

  /* ─────────────── Load playlists once ─────────────── */
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await spotifyAPI.getPlaylists();
        setPlaylists(data);
      } catch (err: any) {
        console.error('Failed to fetch playlists:', err);
        setPlaylistErr(err?.message ?? 'Could not load playlists');
      } finally {
        setLoadingPlaylists(false);
      }
    };
    fetchPlaylists();
  }, []);

  /* ─────────────── Select playlist ─────────────── */
  const handleSelect = (pl: SpotifyPlaylist) => {
    setSelectedPl(pl);
    localStorage.setItem('selected_playlist', JSON.stringify(pl));
    setShowGraph(false);
    setSelectedNode(null);
    setRecommendations([]);
  };

  /* ─────────────── Analyze & build graph ─────────────── */
  const handleAnalyze = async () => {
    if (!selectedPl) return;
    setGraphLoading(true);
    setGraphError(null);
    setAnalysisType('regular');

    try {
      const playlistTracks = await spotifyAPI.getPlaylistTracks(selectedPl.id);

      /* build graph from playlist tracks */
      const nodes: Node[] = playlistTracks.map(({ track }) => {
        const cover =
          track.album.images?.[0]?.url ??
          'https://placehold.co/300x300?text=No+Art';
        return {
          id: track.id,
          label: track.name,
          image: cover,
          metadata: {
            artist: track.artists.map((a) => a.name).join(', '),
            album: track.album.name,
            popularity: track.popularity,
            explicit: track.explicit,
          },
        };
      });

      const links = nodes.map((n, i) => ({
        source: n.id,
        target: nodes[(i + 1) % nodes.length].id,
        weight: 0.5,
      }));

      setGraphData({ nodes, links });
      setShowGraph(true);
    } catch (err: any) {
      console.error('Error analyzing playlist:', err);
      setGraphError(err?.message ?? 'Failed to analyze playlist');

      /* dev fallback */
      if (process.env.NODE_ENV === 'development') {
        setGraphData({
          nodes: [
            { id: '1', label: 'Mock 1', image: '', metadata: {} },
            { id: '2', label: 'Mock 2', image: '', metadata: {} },
          ],
          links: [{ source: '1', target: '2', weight: 1 }],
        });
        setShowGraph(true);
      }
    } finally {
      setGraphLoading(false);
    }
  };

  /* ─────────────── Get recommendations ─────────────── */
  const handleGetRecommendations = async () => {
    if (!selectedPl) return;
    setGraphLoading(true);
    setGraphError(null);
    setAnalysisType('recommendations');

    try {
      // Get access token from localStorage or wherever you store it
      const token = localStorage.getItem('spotify_access_token');

      // Call the backend recommendation endpoint
      const response = await fetch(
        `http://localhost:5000/api/graph/recommendations?playlist_id=${selectedPl.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
            'Spotify-Access-Token': token || ''
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setGraphData(data.graphData || { nodes: [], links: [] });
      setShowGraph(true);
      setActiveTab('recommendations');
    } catch (err: any) {
      console.error('Error getting recommendations:', err);
      setGraphError(err?.message ?? 'Failed to get recommendations');
    } finally {
      setGraphLoading(false);
    }
  };

  /* ────────────────────────────────────────────────────── */

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'calc(100vh - 3.75rem)',
        backgroundColor: 'var(--mantine-color-gray-1)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {!showGraph ? (
        <Stack
          bg="var(--mantine-color-body)"
          style={{ padding: 20, width: '100%', height: '100%' }}
          justify="space-around"
          align="center"
          gap="xs"
        >
          <Text size="xl" fw={700} mb="md">
            Select a Playlist to Analyze
          </Text>

          {loadingPlaylists && (
            <Center style={{ height: '30rem' }}>
              <Loader size="lg" />
            </Center>
          )}

          {playlistErr && (
            <Stack align="center" style={{ height: '30rem', justifyContent: 'center' }}>
              <Text c="red" size="lg">
                {playlistErr}
              </Text>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </Stack>
          )}

          {/* ─── Horizontal scroll list of playlists ─── */}
          {!loadingPlaylists && !playlistErr && playlists.length > 0 && (
            <ScrollArea
              h={480} /* 30 rem */
              offsetScrollbars
              scrollbarSize={8}
              type="always"
              styles={{ viewport: { overflowY: 'hidden' } }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  paddingBottom: 8,
                  minWidth: 'max-content', // prevent wrapping
                }}
              >
                {playlists.map((pl) => {
                  const selected = pl.id === selectedPl?.id;
                  return (
                    <Card
                      key={pl.id}
                      shadow="md"
                      padding="sm"
                      radius="md"
                      w={240}
                      style={{
                        flexShrink: 0,
                        cursor: 'pointer',
                        outline: selected ? '3px solid var(--mantine-color-blue-6)' : 'none',
                      }}
                      onClick={() => handleSelect(pl)}
                    >
                      <Card.Section>
                        <Image
                          src={pl.images?.[0]?.url ?? 'https://via.placeholder.com/300'}
                          alt={pl.name}
                          height={320}
                        />
                      </Card.Section>

                      <Text mt="sm" fw={500} truncate>
                        {pl.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {pl.tracks.total} tracks
                      </Text>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {!loadingPlaylists && !playlistErr && playlists.length === 0 && (
            <Text
              c="dimmed"
              style={{ height: '30rem', display: 'flex', alignItems: 'center' }}
            >
              No playlists found – is &ldquo;playlist‑read‑private&rdquo; in your scopes?
            </Text>
          )}

          {selectedPl && (
            <Group gap="md">
              <Button size="lg" onClick={handleAnalyze} loading={graphLoading && analysisType === 'regular'}>
                {graphLoading && analysisType === 'regular' ? 'Analyzing…' : `Analyze "${selectedPl.name}"`}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                color="green" 
                onClick={handleGetRecommendations} 
                loading={graphLoading && analysisType === 'recommendations'}
              >
                {graphLoading && analysisType === 'recommendations' ? 'Generating…' : 'Get Recommendations'}
              </Button>
            </Group>
          )}
        </Stack>
      ) : (
        /* ─── Graph view ─── */
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              margin: '0 0 1rem 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text size="xl" fw={700}>
              {analysisType === 'recommendations' 
                ? `Recommendations based on: ${selectedPl?.name}` 
                : `Analyzing: ${selectedPl?.name}`
              }
            </Text>
            <Group>
              {analysisType === 'regular' && (
                <Button 
                  variant="outline" 
                  color="green" 
                  onClick={handleGetRecommendations}
                  loading={graphLoading}
                >
                  Get Recommendations
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowGraph(false)}>
                Back to Playlists
              </Button>
            </Group>
          </div>

          {graphError && (
            <Paper p="md" radius="md" mb="md" style={{ backgroundColor: 'var(--mantine-color-red-0)' }}>
              <Text c="red">{graphError}</Text>
            </Paper>
          )}

          <Paper radius="lg" shadow="lg" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {analysisType === 'recommendations' && (
              <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)} style={{ padding: '0 1rem' }}>
                <Tabs.List>
                  <Tabs.Tab value="tracks">Playlist Graph</Tabs.Tab>
                  <Tabs.Tab value="recommendations">Recommendations ({recommendations.length})</Tabs.Tab>
                </Tabs.List>
                
                <Tabs.Panel value="recommendations" p="md">
                  <ScrollArea style={{ height: '180px' }}>
                    <Stack>
                      {recommendations.map((rec) => (
                        <Group key={rec.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                          <Group>
                            <Text fw={600}>{rec.name}</Text>
                            <Text color="dimmed">by {rec.artist}</Text>
                          </Group>
                          <Button 
                            size="xs" 
                            component="a" 
                            href={`https://open.spotify.com/track/${rec.id}`}
                            target="_blank"
                            variant="subtle"
                          >
                            Play on Spotify
                          </Button>
                        </Group>
                      ))}
                    </Stack>
                  </ScrollArea>
                </Tabs.Panel>
              </Tabs>
            )}
            
            <div style={{ flex: 1 }}>
              <ForceGraph
                graphData={graphData}
                onNodeClick={setSelectedNode}
                selectedNode={selectedNode}
              />
            </div>
          </Paper>
        </div>
      )}
    </div>
  );
}