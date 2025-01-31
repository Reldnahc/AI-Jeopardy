import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage.tsx';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import './index.css'; // Include this in the main entry point
import {WebSocketProvider} from "./contexts/WebSocketContext.tsx";
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <WebSocketProvider>
                <Routes>
                    <Route path="/AI-Jeopardy/" element={<MainPage />} />
                    <Route path="/AI-Jeopardy/lobby/:gameId" element={<Lobby />} />
                    <Route path="/AI-Jeopardy/game/:gameId" element={<Game />} />
                    {/* Add other routes for Game, etc., here */}
                </Routes>
            </WebSocketProvider>
        </BrowserRouter>
    </React.StrictMode>
);
