import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { Router } from './components/Router/Router';
import { theme } from './theme';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { MusicMap } from './pages/MusicMap.page';
import { Insights } from './pages/Insights.page';

// *************** EXAMPLE DATA ***************
// passed into music map

const exampleData = {
  nodes: [
    { id: '1', title: 'Song A', artist: 'Artist 1', albumCover: 'https://picsum.photos/200' },
    { id: '2', title: 'Song B', artist: 'Artist 2', albumCover: 'https://picsum.photos/201' },
    { id: '3', title: 'Song C', artist: 'Artist 3', albumCover: 'https://picsum.photos/202' },
    { id: '4', title: 'Song D', artist: 'Artist 4', albumCover: 'https://picsum.photos/203' },
    { id: '5', title: 'Song E', artist: 'Artist 5', albumCover: 'https://picsum.photos/204' },
    { id: '6', title: 'Song F', artist: 'Artist 6', albumCover: 'https://picsum.photos/205' },
    { id: '7', title: 'Song G', artist: 'Artist 7', albumCover: 'https://picsum.photos/206' },
    { id: '8', title: 'Song H', artist: 'Artist 8', albumCover: 'https://picsum.photos/207' },
  ],
  links: [
    { source: '1', target: '2', distance: 100 },
    { source: '1', target: '3', distance: 50 },
    { source: '1', target: '4', distance: 75 },
    { source: '2', target: '5', distance: 300 },
    { source: '2', target: '6', distance: 125 },
    { source: '3', target: '7', distance: 175 },
    { source: '3', target: '8', distance: 100 },
  ],
};


export default function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
      <Router />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/musicmap" element={<MusicMap nodes={exampleData.nodes} links={exampleData.links} />} />
        <Route path="/insights" element={<Insights />} />
        {/* Add more routes here */}
      </Routes>
    </BrowserRouter>
    </MantineProvider>
  );
}
