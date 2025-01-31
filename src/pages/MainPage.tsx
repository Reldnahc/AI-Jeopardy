import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {useWebSocket} from "../contexts/WebSocketContext.tsx";
import randomCategoryList from "../data/randomCategories.ts";


export default function MainPage() {
    const [playerName, setPlayerName] = useState(() => {
        // Retrieve playerName from sessionStorage if available
        return sessionStorage.getItem('playerName') || '';
    });
    const [gameId, setGameId] = useState('');

    const { socket, isSocketReady } = useWebSocket();
    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.setItem('playerName', playerName);
    }, [playerName]);

    const handleGenerateRandomCategories = () => {
        const shuffledCategories = randomCategoryList.sort(() => 0.5 - Math.random());

        return shuffledCategories.slice(0, 11);
    };

    const handleCreateGame = async () => {
        if (!playerName.trim()) {
            alert('Please enter your name.');
            return;
        }
        if (socket && isSocketReady){
            const newGameId = Math.random().toString(36).substr(2, 8).toUpperCase();
            localStorage.setItem("gameId", newGameId);
            localStorage.setItem("playerName", playerName);
            socket.send(JSON.stringify({
                type: 'create-lobby',
                gameId: newGameId,
                host: playerName,
                categories: handleGenerateRandomCategories()
            }));
            navigate(`/AI-Jeopardy/lobby/${newGameId}`, {
                state: {
                    playerName: playerName.trim(),
                    isHost: true,
                },
            });
        } else {
            alert('Please try again later.');
        }
    };

    const handleJoinGame = () => {
        if (!playerName.trim() || !gameId.trim()) {
            alert('Please enter your name and a valid game ID.');
            return;
        }
        if (socket && isSocketReady){
            localStorage.setItem("gameId", gameId);
            localStorage.setItem("playerName", playerName);
            socket.send(JSON.stringify({
                type: 'join-lobby',
                gameId,
                playerName: playerName.trim(),
            }));
            navigate(`/AI-Jeopardy/lobby/${gameId}`, {
                state: {
                    playerName: playerName.trim(),
                    isHost: false,
                },
            });
        } else {
            alert('Please try again later.');
        }
    };

    return (

            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                    <>
                        <h1>Artificially Hallucinating Jeopardy</h1>
                        <h2>Try to answer with the correct question.</h2>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '30px',
                                gap: '20px',
                            }}
                        >
                            {/* Left Section: Player Name, Create Game, and Randomize Categories */}
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Player Name Input */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <label
                                        htmlFor="playerName"
                                        style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Player Name:
                                    </label>
                                    <input
                                        id="playerName"
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Enter your name"
                                        style={{
                                            fontSize: '1rem',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #ccc',
                                            flex: 1,
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateGame}
                                    style={{
                                        fontSize: '1.8rem', // Larger text
                                        padding: '20px 40px', // More padding for height and width
                                        backgroundColor: 'blue', // Retain current color
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px', // Optional: Larger radius for smoother edges
                                        cursor: 'pointer',
                                        width: '100%', // Full width
                                        maxWidth: '500px', // Optional: Prevent it from being too large
                                        margin: '0px auto 0', // Center align below the Final Jeopardy section
                                        display: 'block', // Ensure it's center aligned
                                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', // Optional: A modern shadow effect
                                    }}
                                >
                                    Create Game
                                </button>
                            </div>

                            {/* Right Section: Join a Game */}
                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: '#AAA',
                                    padding: '15px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Join a Game</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* Player Name Input */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label
                                            htmlFor="joinPlayerName"
                                            style={{
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            Player Name:
                                        </label>
                                        <input
                                            id="joinPlayerName"
                                            type="text"
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                            placeholder="Enter your name"
                                            style={{
                                                fontSize: '1rem',
                                                padding: '10px',
                                                borderRadius: '5px',
                                                border: '1px solid #ccc',
                                            }}
                                        />
                                    </div>

                                    {/* Game ID Input */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label
                                            htmlFor="gameId"
                                            style={{
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            Game ID:
                                        </label>
                                        <input
                                            id="gameId"
                                            type="text"
                                            value={gameId}
                                            onChange={(e) => setGameId(e.target.value)}
                                            placeholder="Enter game ID to join"
                                            style={{
                                                fontSize: '1rem',
                                                padding: '10px',
                                                borderRadius: '5px',
                                                border: '1px solid #ccc',
                                            }}
                                        />
                                    </div>

                                    {/* Join Game Button */}
                                    <button
                                        onClick={handleJoinGame}
                                        style={{
                                            fontSize: '1rem',
                                            padding: '10px 20px',
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
                        </div>
                    </>
            </div>

    );
}
