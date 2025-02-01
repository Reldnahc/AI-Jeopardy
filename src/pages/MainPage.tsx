import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from "../contexts/WebSocketContext.tsx";
import randomCategoryList from "../data/randomCategories.ts";

export default function MainPage() {
    const [playerName, setPlayerName] = useState(() => {
        // Retrieve playerName from sessionStorage if available
        return sessionStorage.getItem('playerName') || '';
    });
    const [gameId, setGameId] = useState('');
    const [cotd, setCotd] = useState({
        category: "Science & Nature",
        description: "Explore the wonders of the natural world and the marvels of modern science."
    });

    const { socket, isSocketReady } = useWebSocket();
    const navigate = useNavigate();

    const adjectives = [
        "Artificially Hallucinating",
        "Artificially Intelligent",
        "Artificially Dreaming",
        "Artificially Generated",
        "Artificially Conjured",
    ];

    const randomAdjective = useMemo(
        () => adjectives[Math.floor(Math.random() * adjectives.length)],
        []
    );

    useEffect(() => {
        sessionStorage.setItem('playerName', playerName);
    }, [playerName]);

    useEffect(() => {
        if (socket && isSocketReady) {
            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log(message);
                if (message.type === 'category-of-the-day') {
                    setCotd(message.cotd);
                }
            };

            socket.send(
                JSON.stringify({
                    type: 'check-cotd',
                })
            );
        }
    }, [socket, isSocketReady]);

    const handleGenerateRandomCategories = () => {
        const shuffledCategories = randomCategoryList.sort(() => 0.5 - Math.random());
        return shuffledCategories.slice(0, 11);
    };

    function sendErrorAlert() {
        alert(
            'Connection to Websockets failed. If you are using an adblocker please disable it and refresh the page. Otherwise try again later.'
        );
    }

    const handleCreateGame = async () => {
        if (!playerName.trim()) {
            alert('Please enter your name.');
            return;
        }
        if (socket && isSocketReady) {
            const newGameId = Math.random().toString(36).substr(2, 8).toUpperCase();
            localStorage.setItem('gameId', newGameId);
            localStorage.setItem('playerName', playerName);
            socket.send(
                JSON.stringify({
                    type: 'create-lobby',
                    gameId: newGameId,
                    host: playerName,
                    categories: handleGenerateRandomCategories(),
                })
            );
            navigate(`/lobby/${newGameId}`, {
                state: {
                    playerName: playerName.trim(),
                    isHost: true,
                },
            });
        } else {
            sendErrorAlert();
        }
    };

    const handleJoinGame = () => {
        if (!playerName.trim() || !gameId.trim()) {
            alert('Please enter your name and a valid game ID.');
            return;
        }
        if (socket && isSocketReady) {
            localStorage.setItem('gameId', gameId);
            localStorage.setItem('playerName', playerName);
            socket.send(
                JSON.stringify({
                    type: 'join-lobby',
                    gameId,
                    playerName: playerName.trim(),
                })
            );
            navigate(`/lobby/${gameId}`, {
                state: {
                    playerName: playerName.trim(),
                    isHost: false,
                },
            });
        } else {
            sendErrorAlert();
        }
    };

    return (
        <div className="p-8">
            {/* Outer container to center content */}
            <div className="flex justify-center">
                {/* Main container: stacks vertically on mobile and horizontally on md+ with increased max width */}
                <div className="flex flex-col md:flex-row w-full max-w-screen-2xl">
                    {/* Left Column: Main Functionality */}
                    <div className="flex-1">
                        <div className="p-8 font-sans">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
                                {randomAdjective} Jeopardy
                            </h1>
                            <h2 className="text-xl md:text-2xl mb-10 text-center">
                                Try to answer with the correct question.
                            </h2>

                            {/* Category of the Day Box */}
                            <div className="w-full mb-6 bg-[#AAA] p-6 border border-[#ddd] rounded-lg shadow-md">
                                <h3 className="text-xl mb-4 text-center">
                                    Featured Category
                                </h3>
                                <p className="text-lg text-center">
                                    <strong>{cotd.category}</strong>
                                </p>
                                <p className="text-lg text-center">
                                    {cotd.description}
                                </p>
                            </div>

                            {/* Container for the Create and Join boxes */}
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Create Game Box */}
                                <div className="flex flex-col w-full md:flex-1 bg-[#AAA] p-6 border border-[#ddd] rounded-lg shadow-md">
                                    <h3 className="text-xl mb-4 text-center md:text-left">
                                        Create a Game
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="createPlayerName" className="text-lg font-bold">
                                                Player Name:
                                            </label>
                                            <input
                                                id="createPlayerName"
                                                type="text"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="text-lg p-3 rounded border border-gray-300"
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreateGame}
                                            className="text-lg py-3 px-6 bg-blue-500 text-white border-0 rounded cursor-pointer"
                                        >
                                            Create Game
                                        </button>
                                    </div>
                                </div>

                                {/* Join Game Box */}
                                <div className="flex flex-col w-full md:flex-1 bg-[#AAA] p-6 border border-[#ddd] rounded-lg shadow-md">
                                    <h3 className="text-xl mb-4 text-center md:text-left">
                                        Join a Game
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="joinPlayerName" className="text-lg font-bold">
                                                Player Name:
                                            </label>
                                            <input
                                                id="joinPlayerName"
                                                type="text"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="text-lg p-3 rounded border border-gray-300"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="gameId" className="text-lg font-bold">
                                                Game ID:
                                            </label>
                                            <input
                                                id="gameId"
                                                type="text"
                                                value={gameId}
                                                onChange={(e) => setGameId(e.target.value)}
                                                placeholder="Enter game ID to join"
                                                className="text-lg p-3 rounded border border-gray-300"
                                            />
                                        </div>
                                        <button
                                            onClick={handleJoinGame}
                                            className="text-lg py-3 px-6 bg-green-500 text-white border-0 rounded cursor-pointer"
                                        >
                                            Join Game
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* How to Play Section */}
                            <div className="w-full mt-8 bg-[#AAA] p-6 border border-[#ddd] rounded-lg shadow-md">
                                <h3 className="text-xl mb-4 text-center">
                                    How to Play
                                </h3>
                                <p className="text-lg">
                                    Welcome to our Jeopardy-style game! Follow these steps to get started:
                                </p>
                                <ul className="list-disc pl-6 mt-3 text-lg">
                                    <li>Enter your name in the provided field.</li>
                                    <li>Create a new game or join an existing game by entering its ID.</li>
                                    <li>Once in the game, answer the questions by phrasing your responses as questions.</li>
                                    <li>Have fun and enjoy the game!</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Banner Ad */}
                    <div className="mt-8 w-full md:mt-0 md:ml-6 md:w-72">
                        <div className="bg-gray-300 p-6 text-center rounded shadow-md">
                            Banner Ad
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
