import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Lobby() {
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');
    const navigate = useNavigate();

    const handleCreateGame = () => {
        if (!playerName.trim()) {
            alert('Please enter your name.');
            return;
        }
        const newGameId = Math.random().toString(36).substr(2, 8).toUpperCase();
        navigate(`/game/${newGameId}`, { state: { playerName: playerName.trim(), isHost: true } });

    };

    const handleJoinGame = () => {
        if (!playerName.trim() || !gameId.trim()) {
            alert('Please enter your name and a valid game ID.');
            return;
        }
        navigate(`/game/${gameId}`, { state: { playerName: playerName.trim(), isHost: false } });
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Lobby</h1>
            <div style={{ marginBottom: '20px' }}>
                <label>
                    Player Name:
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name"
                        style={{ marginLeft: '10px', padding: '5px' }}
                    />
                </label>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={handleCreateGame}
                    style={{
                        padding: '10px 20px',
                        marginRight: '10px',
                        backgroundColor: 'blue',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Create Game
                </button>
            </div>
            <div>
                <label>
                    Game ID:
                    <input
                        type="text"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        placeholder="Enter game ID to join"
                        style={{ marginLeft: '10px', padding: '5px' }}
                    />
                </label>
                <button
                    onClick={handleJoinGame}
                    style={{
                        padding: '10px 20px',
                        marginLeft: '10px',
                        backgroundColor: 'green',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Join Game
                </button>
            </div>
        </div>
    );
}
