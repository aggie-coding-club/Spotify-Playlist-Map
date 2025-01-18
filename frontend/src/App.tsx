import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { Router } from './components/Router/Router';
import { theme } from './theme';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { MusicMap } from './pages/MusicMap.page';
import { Insights } from './pages/Insights.page';
import { Dashboard } from './pages/Dashboard.page'

import Callback from './utils/callback'
import ProtectedRoute from './utils/ProtectedRoute';


export default function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
      <Router />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/musicmap" element={<MusicMap/>} />
        <Route path="/insights" element={<Insights/>} />
        <Route path="/callback" element={<Callback/>} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard/>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
    </MantineProvider>
  );
}
