import React, { useEffect, useState } from 'react';
import randomCategoryList from '../data/randomCategories';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext.tsx";
import LobbySidebar from "../components/LobbySidebar.tsx";
import LoadingScreen from "../components/common/LoadingScreen.tsx";
import HostControls from "../components/lobby/HostControls.tsx";
import FinalJeopardyCategory from "../components/lobby/FinalJeopardyCategory.tsx";
import CategoryBoard from "../components/lobby/CategoryBoard.tsx";
import {Player} from "../types/Lobby.ts";
import {useProfile} from "../contexts/ProfileContext.tsx";

type LockedCategories = {
    firstBoard: boolean[]; // Jeopardy lock states
    secondBoard: boolean[]; // Double Jeopardy lock states
    finalJeopardy: boolean[];
};

type BoardType = 'firstBoard' | 'secondBoard';

const Lobby: React.FC = () => {
    const location = useLocation();

    const [categories, setCategories] = useState<{
        firstBoard: string[];
        secondBoard: string[];
        finalJeopardy: string;
    }>({
        firstBoard: ['', '', '', '', ''],
        secondBoard: ['', '', '', '', ''],
        finalJeopardy: '',
    });
    const isHost = location.state?.isHost || false;
    const { gameId } = useParams<{ gameId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadingDots, setLoadingDots] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [players, setPlayers] = useState<Player[]>(location.state?.players || []);
    const [host, setHost] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini'); // Default value for dropdown
    const [sidebarOpen, setSidebarOpen] = useState(false); // Manage sidebar open/close
    const [lockedCategories, setLockedCategories] = useState<LockedCategories>({
        firstBoard: Array(5).fill(false), // Default unlocked
        secondBoard: Array(5).fill(false), // Default unlocked
        finalJeopardy: Array(1).fill(false),
    });

    const { socket, isSocketReady } = useWebSocket();
    const navigate = useNavigate();
    const { profile } = useProfile();

    useEffect(() => {
        if (socket && isSocketReady) {
            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log(message);
                if (message.type === 'player-list-update') {
                    setPlayers(message.players);
                    setHost(message.host);
                }

                if (message.type === 'lobby-state') {
                    setPlayers(message.players);
                    setHost(message.host);
                    if (message.categories) {
                        console.log(message.categories);
                        setCategories({
                            firstBoard: message.categories.slice(0, 5),
                            secondBoard: message.categories.slice(5, 10),
                            finalJeopardy: message.categories[10],
                        });
                    }
                    if (message.lockedCategories) {
                        setLockedCategories({
                            firstBoard: message.lockedCategories.firstBoard,
                            secondBoard: message.lockedCategories.secondBoard,
                            finalJeopardy: message.lockedCategories.finalJeopardy,
                        });
                    }
                }

                if (message.type === 'category-lock-updated') {
                    console.log(message);
                    if (message.boardType in lockedCategories) {
                        setLockedCategories((prev) => {
                            const updated: LockedCategories = { ...prev };
                            updated[message.boardType as BoardType][message.index] = message.locked; // Type-safe access
                            return updated;
                        });
                    } else {
                        console.error(`Invalid boardType: ${message.boardType}`);
                    }
                }

                // Sync updated categories
                if (message.type === 'categories-updated') {
                    setCategories({
                        firstBoard: message.categories.slice(0, 5),
                        secondBoard: message.categories.slice(5, 10),
                        finalJeopardy: message.categories[10],
                    });
                }

                if (message.type === 'trigger-loading') {
                    setIsLoading(true);
                    setLoadingMessage('Generating your questions');
                }

                if (message.type === 'start-game' && profile) {
                    setIsLoading(false);
                    socket.send(
                        JSON.stringify({
                            type: 'join-game',
                            gameId,
                            playerName: profile.displayname,
                        })
                    );
                    navigate(`/game/${gameId}`, {
                        state: {
                            playerName: profile.displayname.trim(),
                            isHost: isHost,
                            host: host,
                            boardData: message.boardData,
                        },
                    });
                }

                if (message.type === 'check-lobby-response') {
                    console.log(message.isValid);
                    if (!message.isValid) {
                        navigate("/");
                    } else {
                        setIsLoading(false);
                    }
                }
            };
            socket.send(
                JSON.stringify({
                    type: 'check-lobby',
                    gameId,
                })
            );
            setIsLoading(true);
        }
    }, [isSocketReady, gameId]);

    useEffect(() => {
        if (isLoading) {
            // Define the ellipsis pattern
            const dotsPattern = ['', '.', '..', '...'];
            let currentIndex = 0;

            // Start an interval to loop through the dots pattern
            const interval = setInterval(() => {
                setLoadingDots(dotsPattern[currentIndex]);
                currentIndex = (currentIndex + 1) % dotsPattern.length;
            }, 750);

            // Cleanup interval when loading stops
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    useEffect(() => {
        const handlePageLeave = () => {
            console.log('Page unloaded');
            if (socket && gameId) {
                console.log('sending leave game');

                // Notify the server to remove the player from the game
                socket.send(
                    JSON.stringify({
                        type: 'leave-game', // Message type for leaving the game
                        gameId,            // The current game
                    })
                );
            }
        };

        // Handle browser tab close, refresh, or manual navigation
        window.addEventListener("beforeunload", handlePageLeave);

    }, [gameId, socket]);


    const onToggleLock = (
        boardType: 'firstBoard' | 'secondBoard' | 'finalJeopardy',
        index: number
    ) => {
        if (socket && isSocketReady) {
            socket.send(
                JSON.stringify({
                    type: 'toggle-lock-category',
                    gameId,
                    boardType,
                    index,
                    locked: !lockedCategories[boardType][index], // Toggle current state
                })
            );
        }
    };

    const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(e.target.value);
    };

    const onChangeCategory = (
        boardType: 'firstBoard' | 'secondBoard' | 'finalJeopardy',
        index: number | undefined,
        value: string
    ) => {
        setCategories((prev) => {
            if (boardType === 'finalJeopardy') {
                const updatedCategories = {
                    ...prev,
                    finalJeopardy: value,
                };

                if (socket && isSocketReady) {
                    socket.send(
                        JSON.stringify({
                            type: 'update-categories',
                            gameId,
                            categories: [
                                ...updatedCategories.firstBoard,
                                ...updatedCategories.secondBoard,
                                updatedCategories.finalJeopardy,
                            ],
                        })
                    );
                }

                return updatedCategories;
            }

            const updatedBoard = [...prev[boardType]];
            if (index !== undefined) {
                updatedBoard[index] = value;
            }

            const updatedCategories = {
                ...prev,
                [boardType]: updatedBoard,
            };

            if (socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'update-categories',
                        gameId,
                        categories: [
                            ...updatedCategories.firstBoard,
                            ...updatedCategories.secondBoard,
                            updatedCategories.finalJeopardy,
                        ],
                    })
                );
            }

            return updatedCategories;
        });
    };

    const handleRandomizeCategory = (
        boardType: 'firstBoard' | 'secondBoard' | 'finalJeopardy',
        index?: number
    ) => {
        setCategories((prev) => {
            const updatedCategories = { ...prev };

            if (boardType === 'finalJeopardy') {
                let newCategory;
                do {
                    newCategory =
                        randomCategoryList[Math.floor(Math.random() * randomCategoryList.length)];
                } while (
                    prev.firstBoard.includes(newCategory) ||
                    prev.secondBoard.includes(newCategory) ||
                    prev.finalJeopardy === newCategory
                    );
                updatedCategories.finalJeopardy = newCategory;
            } else if (index !== undefined) {
                const board = [...updatedCategories[boardType]];
                let newCategory;
                do {
                    newCategory =
                        randomCategoryList[Math.floor(Math.random() * randomCategoryList.length)];
                } while (
                    board.includes(newCategory) ||
                    prev.firstBoard.includes(newCategory) ||
                    prev.secondBoard.includes(newCategory)
                    );
                board[index] = newCategory;
                updatedCategories[boardType] = board;
            }

            if (isHost && socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'update-categories',
                        gameId,
                        categories: [
                            ...updatedCategories.firstBoard,
                            ...updatedCategories.secondBoard,
                            updatedCategories.finalJeopardy,
                        ],
                    })
                );
            }

            return updatedCategories;
        });
    };

    const handleCreateGame = async () => {
        if (!profile) {
            alert('You need to be logged in to create a game.');
            return;
        }
        if (
            categories.firstBoard.some((c) => !c.trim()) ||
            categories.secondBoard.some((c) => !c.trim())
        ) {
            alert('Please fill in all categories for both boards.');
            return;
        }

        try {
            setIsLoading(true);
            setLoadingMessage('Generating your questions');

            if (socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'create-game',
                        gameId,
                        host: profile.displayname,
                        categories: [
                            ...categories.firstBoard,
                            ...categories.secondBoard,
                            categories.finalJeopardy,
                        ],
                        selectedModel,
                    })
                );
            }
        } catch (error) {
            console.error('Failed to generate board data:', error);
            alert('Failed to generate board data. Please try again.');
        }
    };

    // Toggle sidebar state
    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    return isLoading ? (
        <LoadingScreen message={loadingMessage} loadingDots={loadingDots} />
    ) : (
        <div className="flex flex-col md:flex-row h-[calc(100vh-5.5rem)] w-screen overflow-hidden bg-[#2e3a59] ">
            {/* Sidebar Container */}
            <div
                className={`
          fixed top-0 left-0 z-40 w-64 h-full  transform transition-transform duration-300 ease-in-out 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:static md:translate-x-0
        `}
            >
                <LobbySidebar
                    gameId={gameId}
                    isHost={isHost}
                    host={host}
                    players={players}
                    copySuccess={copySuccess}
                    setCopySuccess={setCopySuccess}
                />
            </div>

            {/* Backdrop overlay (only on mobile when sidebar is open) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex flex-col flex-1  p-5 relative overflow-y-auto">
                {/* Mobile Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute top-0 -left-2 md:hidden -rotate-90 p-2 bg-gray-700 text-white rounded focus:outline-none max-w-20"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {/* Wrap board in a flex-grow container */}
                <div className="flex flex-wrap gap-2 justify-around w-full">
                    {/* First Board */}
                    <CategoryBoard
                        title="Jeopardy!"
                        categories={categories.firstBoard}
                        isHost={isHost}
                        lockedCategories={lockedCategories.firstBoard}
                        boardType="firstBoard"
                        onChangeCategory={onChangeCategory}
                        onRandomizeCategory={handleRandomizeCategory}
                        onToggleLock={onToggleLock}
                    />
                    {/* Second Board */}
                    <CategoryBoard
                        title="Double Jeopardy!"
                        categories={categories.secondBoard}
                        isHost={isHost}
                        lockedCategories={lockedCategories.secondBoard}
                        boardType="secondBoard"
                        onChangeCategory={onChangeCategory}
                        onRandomizeCategory={handleRandomizeCategory}
                        onToggleLock={onToggleLock}
                    />
                </div>

                {/* Final Jeopardy Section */}
                <div className="mt-4" >
                    <FinalJeopardyCategory
                        category={categories.finalJeopardy}
                        isHost={isHost}
                        onChangeCategory={onChangeCategory}
                        onRandomizeCategory={handleRandomizeCategory} // Only needs board type
                        lockedCategories={lockedCategories.finalJeopardy}
                        onToggleLock={onToggleLock}
                    />
                </div>


                {/* Host Controls always visible at the bottom */}
                {isHost && (
                    <div className="mt-4">
                        <HostControls
                            selectedModel={selectedModel}
                            onModelChange={handleDropdownChange}
                            onCreateGame={handleCreateGame}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Lobby;
