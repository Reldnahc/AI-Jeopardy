import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import randomCategoryList from '../data/randomCategories';

export default function Main() {
    const [playerName, setPlayerName] = useState(() => {
        // Retrieve playerName from sessionStorage if available
        return sessionStorage.getItem('playerName') || '';
    });
    const [gameId, setGameId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadingDots, setLoadingDots] = useState('');
    const [categories, setCategories] = useState<{
        firstBoard: string[];
        secondBoard: string[];
        finalJeopardy: string;
    }>({
        firstBoard: ['', '', '', '', ''],
        secondBoard: ['', '', '', '', ''],
        finalJeopardy: '',
    });

    const navigate = useNavigate();

    useEffect(() => {
        handleGenerateRandomCategories();
    }, []);

    useEffect(() => {
        sessionStorage.setItem('playerName', playerName);
    }, [playerName]);

    useEffect(() => {
        if (isLoading) {
            // Define the ellipsis pattern
            const dotsPattern = ['', '.', '..', '...'];
            let currentIndex = 0;

            // Start an interval to loop through the dots pattern
            const interval = setInterval(() => {
                setLoadingDots(dotsPattern[currentIndex]);
                currentIndex = (currentIndex + 1) % dotsPattern.length; // Cycle through the array
            }, 750); // Update every 500ms

            // Cleanup interval when loading stops
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    // Function to generate 5 random categories
    const handleGenerateRandomCategories = () => {
        // Shuffle the categories once
        const shuffledCategories = randomCategoryList.sort(() => 0.5 - Math.random());

        // Split into two separate sets of unique categories
        const firstBoard = shuffledCategories.slice(0, 5); // First 5 categories
        const secondBoard = shuffledCategories.slice(5, 10); // Next 5 categories, no overlap with firstBoard
        const finalJeopardy = shuffledCategories[10];

        // Ensure they are unique and set the categories
        setCategories({ firstBoard, secondBoard, finalJeopardy });
    };

    // Function to randomize a single category
    const handleRandomizeCategory = (boardType: 'firstBoard' | 'secondBoard' | 'finalJeopardy', index?: number) => {
        setCategories((prev) => {
            if (boardType === 'finalJeopardy') {
                // Handle Final Jeopardy randomization
                let newCategory;

                // Avoid duplicates: pick a random category not already in use
                do {
                    newCategory = randomCategoryList[Math.floor(Math.random() * randomCategoryList.length)];
                } while (
                    prev.firstBoard.includes(newCategory) ||
                    prev.secondBoard.includes(newCategory) ||
                    prev.finalJeopardy === newCategory // Avoid repetition of the current final jeopardy
                    );

                // Update only the `finalJeopardy` field and return the new state
                return { ...prev, finalJeopardy: newCategory };
            } else if (boardType === 'firstBoard' || boardType === 'secondBoard') {
                // Handle board randomization (existing logic)
                const updatedBoard = [...prev[boardType]];
                let newCategory;

                // Avoid duplicates: pick a random category not already in use
                do {
                    newCategory = randomCategoryList[Math.floor(Math.random() * randomCategoryList.length)];
                } while (
                    updatedBoard.includes(newCategory) || // Ensure no duplicates in this board
                    prev.firstBoard.includes(newCategory) || // Ensure no overlap with the first board
                    prev.secondBoard.includes(newCategory) // Ensure no overlap with the second board
                    );

                // Update the target category in the board and return the new state
                if (index !== undefined) {
                    updatedBoard[index] = newCategory;
                }
                return { ...prev, [boardType]: updatedBoard };
            }

            return prev; // Default case (no changes)
        });
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
            setIsLoading(true); // Show the loading screen
            setLoadingMessage('Generating your questions');
            // Generate the board via API using the provided categories
            const response = await axios.post('https://ee2c-71-34-19-23.ngrok-free.app/generate-board', {
                    categories: [...categories.firstBoard, ...categories.secondBoard, categories.finalJeopardy],
                }
            );

            const { firstBoard, secondBoard, finalJeopardy } = response.data.boardData;

            setLoadingMessage('Loading game');
            setTimeout(() => {
                setIsLoading(false);
                navigate(`/game/${newGameId}`, {
                    state: {
                        playerName: playerName.trim(),
                        isHost: true,
                        boardData: { firstBoard, secondBoard, finalJeopardy },
                    },
                });
            }, 1000); // Add a slight delay for smoother transition
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
            {isLoading ? (
                // Render the loading screen if loading
                <div
                    style={{
                        position: 'fixed', // Locks the overlay to the viewport
                        top: 0, // Y-axis start point
                        left: 0, // X-axis start point
                        width: '100vw', // Full width of the viewport
                        height: '100vh', // Full height of the viewport

                        backgroundColor: '#333', // Use a background to obscure other content
                        color: '#fff',
                        fontSize: '1.5rem',
                        display: 'flex', // Flexbox for centering
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column', // Stack message and spinner
                        overflow: 'hidden', // Ensures no scrollbars appear
                        zIndex: 1000, // Ensures it appears on top of any other UI components
                    }}
                >
                    <div className="spinner" style={{ marginBottom: '20px' }} />
                    <p>{loadingMessage}
                        <span
                            style={{
                                display: 'inline-block', // Ensures dots always occupy the same space
                                width: '2ch', // Reserves space for up to 3 characters (dots)
                                textAlign: 'left', // Align dots naturally
                            }}
                        >{loadingDots}</span>
                    </p>
                </div>

            ) : (
                // Main Lobby UI
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

                            {/* Buttons: Randomize Categories and Create Game */}
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={handleGenerateRandomCategories}
                                    style={{
                                        fontSize: '1rem',
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

                        {/* Right Section: Join a Game */}
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#f9f9f9',
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', marginTop: '30px' }}>
                        {/* First Board */}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Enter 5 Categories for Jeopardy!:</h2>
                            {categories.firstBoard.map((category, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '15px',
                                        gap: '15px', // Space between elements
                                    }}
                                >
                                    <label
                                        htmlFor={`firstBoard-${index}`}
                                        style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap', // Prevent wrapping for labels
                                        }}
                                    >
                                        Category {index + 1}:
                                    </label>
                                    <input
                                        id={`firstBoard-${index}`}
                                        type="text"
                                        value={category}
                                        onChange={(e) =>
                                            setCategories((prev) => {
                                                const updatedBoard = [...prev.firstBoard];
                                                updatedBoard[index] = e.target.value;
                                                return { ...prev, firstBoard: updatedBoard };
                                            })
                                        }
                                        placeholder={`First Board Category ${index + 1}`}
                                        style={{
                                            fontSize: '1.2rem',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #ccc',
                                            flex: 1, // Take available space
                                        }}
                                    />
                                    <button
                                        onClick={() => handleRandomizeCategory('firstBoard', index)}
                                        style={{
                                            fontSize: '1rem',
                                            padding: '10px 15px',
                                            backgroundColor: 'orange',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap', // Prevent button text wrapping
                                            flexShrink: 0, // Prevent the button from shrinking
                                        }}
                                    >
                                        Randomize
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Second Board */}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Categories for Double Jeopardy!:</h2>
                            {categories.secondBoard.map((category, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '15px',
                                        gap: '15px',
                                    }}
                                >
                                    <label
                                        htmlFor={`secondBoard-${index}`}
                                        style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Category {index + 1}:
                                    </label>
                                    <input
                                        id={`secondBoard-${index}`}
                                        type="text"
                                        value={category}
                                        onChange={(e) =>
                                            setCategories((prev) => {
                                                const updatedBoard = [...prev.secondBoard];
                                                updatedBoard[index] = e.target.value;
                                                return { ...prev, secondBoard: updatedBoard };
                                            })
                                        }
                                        placeholder={`Second Board Category ${index + 1}`}
                                        style={{
                                            fontSize: '1.2rem',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #ccc',
                                            flex: 1,
                                        }}
                                    />
                                    <button
                                        onClick={() => handleRandomizeCategory('secondBoard', index)}
                                        style={{
                                            fontSize: '1rem',
                                            padding: '10px 15px',
                                            backgroundColor: 'orange',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}
                                    >
                                        Randomize
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px' }}>
                        <label
                            htmlFor="finalJeopardy"
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap', // Prevent wrapping for labels
                            }}
                        >
                            Final Jeopardy:
                        </label>
                        <input
                            type="text"
                            value={categories.finalJeopardy}
                            onChange={(e) => setCategories((prev) => ({ ...prev, finalJeopardy: e.target.value }))}
                            placeholder="Enter Final Jeopardy Category"
                            style={{
                                fontSize: '1.2rem',
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                flex: 1, // Take remaining space to make the input flexible
                            }}
                        />
                        <button
                            onClick={() => handleRandomizeCategory('finalJeopardy')}
                            style={{
                                fontSize: '1rem',
                                padding: '10px 15px',
                                backgroundColor: 'orange',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Randomize
                        </button>
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
                </>
            )}
        </div>
    );
}
