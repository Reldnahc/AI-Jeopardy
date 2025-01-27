import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Main from './pages/Main';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import './App.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/lobby/:gameId" element={<Lobby />} />
                <Route path="/game/:gameId" element={<Game />} />
                {/* Add other routes for Game, etc., here */}
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
