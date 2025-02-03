import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage.tsx';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import Header from './components/common/Header.tsx';
import './index.css'; // Include this in the main entry point
import {WebSocketProvider} from "./contexts/WebSocketContext.tsx";
import { AuthProvider } from './contexts/AuthContext.tsx';
import Profile from "./pages/Profile.tsx";
import {ProfileProvider} from "./contexts/ProfileContext.tsx";
import RecentBoards from "./pages/RecentBoards.tsx";
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <AuthProvider>
                <ProfileProvider>
                    <WebSocketProvider>
                        <Header/>
                        <Routes>
                            <Route path="/" element={<MainPage />} />
                            <Route path="/lobby/:gameId" element={<Lobby />} />
                            <Route path="/game/:gameId" element={<Game />} />
                            <Route path="/profile/:username" element={<Profile />} />
                            <Route path="/recent-boards" element={<RecentBoards />} />
                            {/* Add other routes for Game, etc., here */}
                        </Routes>
                    </WebSocketProvider>
                </ProfileProvider>
            </AuthProvider>
        </HashRouter>
    </React.StrictMode>
);
