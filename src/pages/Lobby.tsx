import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import randomCategoryList from '../data/randomCategories';

export default function Lobby() {
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');
    const [categories, setCategories] = useState({
        firstBoard: ['', '', '', '', ''], // 5 categories for round 1
        secondBoard: ['', '', '', '', ''], // 5 categories for round 2
    });
    const navigate = useNavigate();

    useEffect(() => {
        handleGenerateRandomCategories();
    }, []);

    // Function to generate 5 random categories
    const handleGenerateRandomCategories = () => {
        let shuffledCategories = randomCategoryList.sort(() => 0.5 - Math.random());
        const firstBoard = shuffledCategories.slice(0, 5); // Choose 5 random categories
        shuffledCategories = randomCategoryList.sort(() => 0.5 - Math.random());
        const secondBoard = shuffledCategories.slice(0, 5); // Choose 5 random categories

        setCategories({firstBoard, secondBoard});
    };


    const handleCreateGame = async () => {
        if (!playerName.trim()) {
            alert('Please enter your name.');
            return;
        }

        // Validation for all categories
        if (categories.firstBoard.some((c) => !c.trim()) || categories.secondBoard.some((c) => !c.trim())) {
            alert('Please fill in all categories for both boards.');
            return;
        }


        const newGameId = Math.random().toString(36).substr(2, 8).toUpperCase();

        try {
            // Generate the board via API using the provided categories
            const response = await axios.post('https://4101-71-34-19-23.ngrok-free.app/generate-board', {
                    categories: [...categories.firstBoard, ...categories.secondBoard],
                }
            );

            console.log('Generated board data:', response.data.boardData);

            const { firstBoard, secondBoard } = response.data.boardData;

            // Navigate to the game with the generated board data
            navigate(`/game/${newGameId}`, {
                state: {
                    playerName: playerName.trim(),
                    isHost: true,
                    boardData: { firstBoard, secondBoard },
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

            {/* Section for creating a player's name for creating a game */}
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

            {/* Categories for First Board */}
            <div style={{ marginTop: '20px' }}>
                <h3>Enter 5 Categories for the First Board:</h3>
                {categories.firstBoard.map((category, index) => (
                    <div key={index}>
                        <label>
                            Category {index + 1}:
                            <input
                                type="text"
                                value={category}
                                onChange={(e) =>
                                    setCategories((prev) => {
                                        const newFirstBoard = [...prev.firstBoard];
                                        newFirstBoard[index] = e.target.value;
                                        return { ...prev, firstBoard: newFirstBoard };
                                    })
                                }
                                placeholder={`First Board Category ${index + 1}`}
                                style={{ marginLeft: '10px', padding: '5px' }}
                            />
                        </label>
                    </div>
                ))}
            </div>

            {/* Categories for Second Board */}
            <div style={{ marginTop: '20px' }}>
                <h3>Enter 5 Categories for the Second Board:</h3>
                {categories.secondBoard.map((category, index) => (
                    <div key={index}>
                        <label>
                            Category {index + 1}:
                            <input
                                type="text"
                                value={category}
                                onChange={(e) =>
                                    setCategories((prev) => {
                                        const newSecondBoard = [...prev.secondBoard];
                                        newSecondBoard[index] = e.target.value;
                                        return { ...prev, secondBoard: newSecondBoard };
                                    })
                                }
                                placeholder={`Second Board Category ${index + 1}`}
                                style={{ marginLeft: '10px', padding: '5px' }}
                            />
                        </label>
                    </div>
                ))}
            </div>

            {/* Button Section for Creating a Game */}
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

            {/* Section for Joining a Game */}
            <div style={{ marginTop: '20px' }}>
                <h3>Join a Game:</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <label>
                        Player Name:
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name"
                            style={{ padding: '5px' }}
                        />
                    </label>
                    <button
                        onClick={handleJoinGame}
                        style={{
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

            {/* Randomization Button */}
            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={handleGenerateRandomCategories}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: 'orange',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Randomize Categories
                </button>
            </div>
        </div>
    );
}
