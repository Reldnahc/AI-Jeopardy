import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage.tsx';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import './index.css'; // Include this in the main entry point
import {WebSocketProvider} from "./contexts/WebSocketContext.tsx";
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <WebSocketProvider>
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/lobby/:gameId" element={<Lobby />} />
                    <Route path="/game/:gameId" element={<Game />} />
                    {/* Add other routes for Game, etc., here */}
                </Routes>
            </WebSocketProvider>
        </HashRouter>
    </React.StrictMode>
);
