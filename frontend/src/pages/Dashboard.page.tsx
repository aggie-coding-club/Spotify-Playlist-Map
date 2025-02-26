import { useEffect, useState } from 'react';
import {
  AppShell,
  Container,
  Grid,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Avatar,
  Tabs,
  rem,
} from '@mantine/core';
import { IconPlaylist, IconChartBar } from '@tabler/icons-react';
import { Router } from '../components/Router/Router';
import { spotifyAPI } from '../utils/spotifyAPI';
import { LoadingOverlay } from '@mantine/core';

interface UserData {
  display_name: string;
  images?: { url: string }[];
}

export function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Load user data from localStorage
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }

        // Load playlists and top tracks
        const [playlistsData, topTracksData] = await Promise.all([
          spotifyAPI.getPlaylists(),
          spotifyAPI.getTopTracks('medium_term')
        ]);

        setPlaylists(playlistsData);
        setTopTracks(topTracksData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const iconStyle = { width: rem(20), height: rem(20) };

  return (
    <>
      <LoadingOverlay visible={isLoading} />
      <Container size="lg" maw={1200}>
        {userData && (
          <Group mb="xl">
            <Avatar 
              src={userData.images?.[0]?.url} 
              size="xl" 
              radius="xl"
            />
            <Stack gap={0}>
              <Text size="xs" fw={700} c="dimmed">WELCOME BACK</Text>
              <Title order={1}>{userData.display_name}</Title>
            </Stack>
          </Group>
        )}

        <Tabs defaultValue="playlists">
          <Tabs.List>
            <Tabs.Tab 
              value="playlists" 
              leftSection={<IconPlaylist style={iconStyle} />}
            >
              Your Playlists
            </Tabs.Tab>
            <Tabs.Tab 
              value="top-tracks" 
              leftSection={<IconChartBar style={iconStyle} />}
            >
              Top Tracks
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="playlists" pt="xl">
            <Grid>
              {playlists.map((playlist) => (
                <Grid.Col key={playlist.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Card.Section>
                      <img
                        src={playlist.images[0]?.url || '/api/placeholder/300/300'}
                        alt={playlist.name}
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                      />
                    </Card.Section>

                    <Group justify="space-between" mt="md" mb="xs">
                      <Text fw={500} lineClamp={1}>{playlist.name}</Text>
                    </Group>

                    <Text size="sm" c="dimmed">
                      {playlist.tracks.total} tracks
                    </Text>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="top-tracks" pt="xl">
            <Stack gap="md">
              {topTracks.map((track, index) => (
                <Card key={track.id} padding="sm" withBorder>
                  <Group>
                    <Text size="lg" fw={700} w={30} ta="center">
                      {index + 1}
                    </Text>
                    <img
                      src={track.album.images[2]?.url || '/api/placeholder/64/64'}
                      alt={track.name}
                      style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                    />
                    <Stack gap={0} style={{ flex: 1 }}>
                      <Text fw={500} lineClamp={1}>{track.name}</Text>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {track.artists.map((artist: { name: string }) => artist.name).join(', ')}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </>
  );
}