import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from "../contexts/WebSocketContext.tsx";
import randomCategoryList from "../data/randomCategories.ts";
import {useAuth} from "../contexts/AuthContext.tsx";
import {useProfile} from "../contexts/ProfileContext.tsx";

export default function MainPage() {
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState('');
    const [cotd, setCotd] = useState({
        category: "Science & Nature",
        description: "Explore the wonders of the natural world and the marvels of modern science."
    });

    const { user } = useAuth();
    const { profile } = useProfile();
    const { socket, isSocketReady } = useWebSocket();
    const navigate = useNavigate();

    const adjectives = [
        "Hallucinated",
        "Intelligent",
        "Dreamt",
        "Generated",
        "Conjured",
        "Created",
    ];

    const randomAdjective = useMemo(
        () => adjectives[Math.floor(Math.random() * adjectives.length)],
        []
    );

    useEffect(() => {
        const fetchUsername = async () => {
            if (user && profile) {
                setPlayerName(profile.displayname);
            } else {
                setPlayerName("");
            }
        };

        fetchUsername();
    }, [user, profile]);

    useEffect(() => {
        if (socket && isSocketReady) {
            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log(message);
                if (message.type === 'category-of-the-day') {
                    setCotd(message.cotd);
                }
                if (message.type === 'lobby-created') {
                    navigate(`/lobby/${message.gameId}`, {
                        state: {
                            playerName: playerName,
                            isHost: true,
                            players: message.players,
                            categories: message.categories,
                        },
                    });
                    console.log("help me");
                    console.log(message.gameId);
                    socket.send(
                        JSON.stringify({
                            type: 'request-lobby-state',
                            gameId: message.gameId,
                        })
                    );
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
        if (!user) {
            alert('Please log in to create a game.');
            return;
        }
        if (socket && isSocketReady) {
            const newGameId = Math.random().toString(36).substr(2, 8).toUpperCase();

            socket.send(
                JSON.stringify({
                    type: 'create-lobby',
                    gameId: newGameId,
                    host: playerName,
                    categories: handleGenerateRandomCategories(),
                })
            );
        } else {
            sendErrorAlert();
        }
    };

    const handleJoinGame = () => {
        if (!user) {
            alert('Please log in to create a game.');
            return;
        }
        if (!gameId.trim()) {
            alert('Please a valid game ID.');
            return;
        }
        if (socket && isSocketReady) {
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
                                Artificially {randomAdjective} Jeopardy
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


                                        <button
                                            onClick={handleCreateGame}
                                            className="text-lg py-3 px-6 bg-blue-500 text-white border-0 rounded cursor-pointer w-3/5 shadow-md"
                                        >
                                            Create Game
                                        </button>


                                {/* Join Game Box */}
                                <div className="flex flex-col w-full md:flex-1 bg-[#AAA] p-6 border border-[#ddd] rounded-lg shadow-md">
                                    <h3 className="text-xl mb-4 text-center md:text-left">
                                        Join a Game
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
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
