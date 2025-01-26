import { useState } from 'react';
import { 
  AppShell, 
  Text, 
  Title, 
  Container, 
  Grid, 
  Button, 
  Stack,
} from '@mantine/core'
import { 
  IconBrandSpotify, 
  IconChartBar, 
  IconUsers,
  IconTrendingUp,
  IconPlaylist,
  IconWorldSearch
} from '@tabler/icons-react';


import { Router } from '../components/Router/Router';
import { FeatureCard } from '../components/FeatureCard/FeatureCard';
import { Footer } from '../components/Footer/Footer'

import { spotifyAPI } from '../utils/spotifyAPI';

export function HomePage() {
  
  const featureCards = [
    [
      { 
        title: 'Musical Insights',
        icon: <IconChartBar size={24} stroke={1.5} />,
        span: { base: 12, xs: 6 },
        style: { height: '21rem' },
        content: <Text style={{color: 'gray'}}>Dive deep into the analytics of your music listening habits, uncovering trends and patterns that define you.</Text>
      },
      { 
        title: 'Community',
        icon: <IconUsers size={24} stroke={1.5} />,
        span: { base: 12, xs: 6 },
        style: { height: '18rem' },
        content: <Text style={{color: 'gray'}}>Connect with fellow listeners who resonate with your musical wavelength and explore shared sonic experiences.</Text>
      }
    ],
    [
      { 
        title: 'Trend Analysis',
        icon: <IconTrendingUp size={24} stroke={1.5} />,
        span: { base: 12, xs: 6 },
        style: { height: '13rem' },
        content: <Text style={{color: 'gray'}}>Track your evolving music preferences and discover emerging trends through advanced data analysis.</Text>
      },
      { 
        title: 'Playlist Optimizer',
        icon: <IconPlaylist size={24} stroke={1.5} />,
        span: { base: 12, xs: 6 },
        style: { height: '10rem' },
        content: <Text style={{color: 'gray'}}>Curate and refine your playlists with intelligent recommendations.</Text>
      },
      { 
        title: 'Global Music Exploration',
        icon: <IconWorldSearch size={24} stroke={1.5} />,
        span: { base: 12, xs: 6 },
        style: { height: '14rem' },
        content: <Text style={{color: 'gray'}}>Expand your musical horizons by discovering artists and genres from around the world, tailored to your unique taste.</Text>
      }
    ]
  ];

  const handleSpotifyConnect = async () => {
    try {
      const authUrl = await spotifyAPI.initiateLogin();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Spotify login:', error);
    }
  };


  return (
    <AppShell
      header={{ height: 100 }} 
      padding="md"
    >
      <AppShell.Header>
        <Router />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" maw={1200}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Text size="xs" fw={700}>
                  VIBEMAP FOR SPOTIFY
                </Text>

                <Title size="h1">
                  discover musical insights with{' '}
                  <Text inherit variant="gradient" component="span" 
                    gradient={{ from: 'darkgreen', to: 'green' }}>
                    VibeMap
                  </Text>
                </Title>

                <Text size="md" c="dimmed" maw={500}>
                  Uncover the rhythm behind your favorite songs. Get personalized insights 
                  that reveal the unique patterns of your music taste, and explore new sounds.
                </Text>

                <Button 
                  leftSection={<IconBrandSpotify size={30} />}
                  color="green"
                  onClick={handleSpotifyConnect}
                  size="md"
                  mt="md"
                  radius='xl'
                  w={220}
                >
                  Connect to Spotify
                </Button>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Grid>
                {/* First Column */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack>
                    {featureCards[0].map((card, index) => (
                      <FeatureCard
                        key={index}
                        title={card.title}
                        span={card.span}
                        style={card.style}
                        icon={card.icon}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = 'md';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'md';
                        }}
                      >
                        {card.content}
                      </FeatureCard>
                    ))}
                  </Stack>
                </Grid.Col>

                {/* Second Column */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack>
                    {featureCards[1].map((card, index) => (
                      <FeatureCard
                        key={index}
                        title={card.title}
                        span={card.span}
                        style={card.style}
                        icon={card.icon}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = 'md';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'md';
                        }}
                      >
                        {card.content}
                      </FeatureCard>
                    ))}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Grid.Col>
          </Grid>
        </Container>
        <Footer/>
      </AppShell.Main>
    </AppShell>
  );
}