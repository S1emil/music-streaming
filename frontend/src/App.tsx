import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import Header from './components/Header';
import Player from './components/Player';
import FullScreenPlayer from './components/FullScreenPlayer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import Profile from './pages/Profile';
import TrackDetail from './pages/TrackDetail';
import UploadTrack from './pages/UploadTrack';
import Admin from './pages/Admin';
import Radio from './pages/Radio';
import AllTracks from './pages/AllTracks';
import GeneratePlaylist from './pages/GeneratePlaylist';
import Stats from './pages/Stats';
import './styles/index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Загрузка...</div>;
  if (user) return <Navigate to="/" />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [fullScreen, setFullScreen] = React.useState(false);
  const { currentTrack } = usePlayer();

  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/search" element={<Search />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/tracks" element={<AllTracks />} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/track/:id" element={<TrackDetail />} />
            <Route path="/upload" element={<ProtectedRoute><UploadTrack /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/generate-playlist" element={<ProtectedRoute><GeneratePlaylist /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </main>
        {currentTrack && <Player onExpand={() => setFullScreen(true)} />}
        {fullScreen && <FullScreenPlayer onClose={() => setFullScreen(false)} />}
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  </AuthProvider>
);

export default App;
