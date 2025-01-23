import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Lobby() {
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');
    const [categories, setCategories] = useState(['', '', '', '', '']); // Initial empty categories
    const navigate = useNavigate();
    const randomCategoryList = [
        'Science',
        'History',
        'Technology',
        'Music',
        'Sports',
        'Movies',
        'Literature',
        'Geography',
        'Mathematics',
        'Art',
        'Animals',
        'Anime',
        'Video Games',
        'Books',
        'Comics',
        'Food',
        'Music',
        'Philosophy',
    ];

    useEffect(() => {
        handleGenerateRandomCategories();
    }, []);

    // Function to generate 5 random categories
    const handleGenerateRandomCategories = () => {
        const shuffledCategories = randomCategoryList.sort(() => 0.5 - Math.random());
        const randomCategories = shuffledCategories.slice(0, 5); // Choose 5 random categories
        setCategories(randomCategories);
    };


    const handleCreateGame = async () => {
        if (!playerName.trim()) {
            alert('Please enter your name.');
            return;
        }

        // Check if all categories are filled
        if (categories.some((category) => !category.trim())) {
            alert('Please fill in all 5 categories.');
            return;
        }

        const newGameId = Math.random().toString(36).substr(2, 8).toUpperCase();

        try {
            // Generate the board via API using the provided categories
            const response = await axios.post('http://localhost:3000/generate-board', {categories});

            console.log('Generated board data:', response.data.boardData);

            const generatedBoardData = response.data.boardData;

            // Navigate to the game with the generated board data
            navigate(`/game/${newGameId}`, {
                state: {
                    playerName: playerName.trim(),
                    isHost: true,
                    boardData: generatedBoardData,
                },
            });
        } catch (error) {
            console.error('Failed to generate board data:', error);
            alert('Failed to generate board data. Please try again.');
        }

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
            <div style={{ marginTop: '20px' }}>
                <h3>Enter 5 Categories:</h3>
                {categories.map((category, index) => (
                    <div key={index}>
                        <label>
                            Category {index + 1}:
                            <input
                                type="text"
                                value={category}
                                onChange={(e) =>
                                    setCategories((prev) => {
                                        const newCategories = [...prev];
                                        newCategories[index] = e.target.value;
                                        return newCategories;
                                    })
                                }
                                placeholder={`Category ${index + 1}`}
                                style={{ marginLeft: '10px', padding: '5px' }}
                            />
                        </label>
                    </div>
                ))}
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
