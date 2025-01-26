import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingOverlay, Alert, Container, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get all parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for error
        const error = urlParams.get('error');
        if (error) {
          throw new Error(error);
        }

        // Get tokens and user data from URL parameters
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const jwtToken = urlParams.get('jwt_token');
        const userDataString = urlParams.get('user_data');

        // Validate we have all required data
        if (!accessToken || !refreshToken || !jwtToken || !userDataString) {
          throw new Error('Missing required authentication data');
        }

        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userDataString));

        // Store everything in localStorage
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_refresh_token', refreshToken);
        localStorage.setItem('jwt_token', jwtToken);
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <Container size="sm" style={{ height: '100vh', position: 'relative' }}>
      <LoadingOverlay visible={!error} overlayProps={{ blur: 2 }} />
      {error && (
        <Stack style={{ paddingTop: '2rem' }}>
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Authentication Error"
            color="red"
            variant="filled"
          >
            {error}
          </Alert>
        </Stack>
      )}
    </Container>
  );
}