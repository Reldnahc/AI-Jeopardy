import React, {useEffect, useState} from 'react';
import randomCategoryList from '../data/randomCategories';
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useWebSocket} from "../contexts/WebSocketContext.tsx";
import LobbySidebar from "../components/LobbySidebar.tsx";
import LoadingScreen from "../components/common/LoadingScreen.tsx";
import CategoryBoardContainer from "../components/lobby/CategoryBoardContainer.tsx";
import HostControls from "../components/lobby/HostControls.tsx";

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
    const playerName = location.state?.playerName || 'Spectator';
    const {gameId} = useParams<{ gameId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadingDots, setLoadingDots] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [host, setHost] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini'); // Default value for dropdown

    const { socket, isSocketReady } = useWebSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (socket && isSocketReady){
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
                }

                // Sync updated categories
                if (message.type === 'categories-updated') {
                    setCategories({
                        firstBoard: message.categories.slice(0, 5),
                        secondBoard: message.categories.slice(5, 10),
                        finalJeopardy: message.categories[10],
                    });
                }

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

                if (message.type === 'start-game') {
                    setIsLoading(false);
                    socket.send(
                        JSON.stringify({
                            type: 'join-game',
                            gameId,
                            playerName
                        })
                    );
                    console.log(message.boardData.firstBoard);
                    navigate(`/AI-Jeopardy/game/${gameId}`, {
                        state: {
                            playerName: playerName.trim(),
                            isHost: isHost,
                            boardData: message.boardData,
                        },
                    });
                }

                if (message.type === 'check-lobby-response') {
                    console.log(message.isValid);
                    if (!message.isValid) {
                        navigate("/AI-Jeopardy/");
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
    }, [socket, gameId]);

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

    const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(e.target.value); // Update state with the selected value
    };

    const onChangeCategory = (
        boardType: 'firstBoard' | 'secondBoard' | 'finalJeopardy',
        index: number | undefined,
        value: string
    ) => {
        if (!isHost) return; // Only allow the host to update categories

        setCategories((prev) => {
            // Handle finalJeopardy case separately
            if (boardType === 'finalJeopardy') {
                const updatedCategories = {
                    ...prev,
                    finalJeopardy: value, // Update the final jeopardy value
                };

                // Notify the server of the changes
                if (socket && isSocketReady) {
                    socket.send(
                        JSON.stringify({
                            type: 'update-categories',
                            gameId,
                            host: playerName,
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

            // Otherwise, handle firstBoard or secondBoard
            const updatedBoard = [...prev[boardType]];
            if (index !== undefined) {
                updatedBoard[index] = value;
            }

            const updatedCategories = {
                ...prev,
                [boardType]: updatedBoard,
            };

            // Notify the server of the changes
            if (socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'update-categories',
                        gameId,
                        host: playerName,
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
                    newCategory = randomCategoryList[Math.floor(Math.random() * randomCategoryList.length)];
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
                    newCategory = randomCategoryList[Math.floor(Math.random() * randomCategoryList.length)];
                } while (
                    board.includes(newCategory) ||
                    prev.firstBoard.includes(newCategory) ||
                    prev.secondBoard.includes(newCategory)
                    );
                board[index] = newCategory;
                updatedCategories[boardType] = board;
            }

            // Notify the server of the changes only if the player is the host
            if (isHost && socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'update-categories',
                        gameId,
                        host: playerName,
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
        if (!playerName.trim()) {
            alert('Please enter your name.');
            return;
        }
        // Validation for all categories
        if (categories.firstBoard.some((c) => !c.trim()) || categories.secondBoard.some((c) => !c.trim())) {
            alert('Please fill in all categories for both boards.');
            return;
        }

        try {
            setIsLoading(true); // Show the loading screen
            setLoadingMessage('Generating your questions');

            if (socket && isSocketReady){
                socket.send(JSON.stringify({
                    type: 'create-game',
                    gameId,
                    host: playerName,
                    players,
                    categories: [...categories.firstBoard, ...categories.secondBoard, categories.finalJeopardy],
                    selectedModel
                }));
            }

        } catch (error) {
            console.error('Failed to generate board data:', error);
            alert('Failed to generate board data. Please try again.');
        }
    };

    return isLoading ? (
        <LoadingScreen message={loadingMessage} loadingDots={loadingDots} />
    ) : (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    height: '100vh',
                    width: '100vw',
                    overflow: 'hidden',
                    padding: '10px',
                    boxSizing: 'border-box',
                    background: 'linear-gradient(135deg, #2e3a59, #1c2538)',
                }}
            >
                <LobbySidebar
                    gameId={gameId}
                    isHost={isHost}
                    host={host}
                    players={players}
                    copySuccess={copySuccess}
                    setCopySuccess={setCopySuccess}
                />

                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        backgroundColor: '#2e3a59',
                        padding: '20px',
                    }}
                >
                    <CategoryBoardContainer
                        categories={categories}
                        isHost={isHost}
                        onChangeCategory={onChangeCategory}
                        onRandomizeCategory={handleRandomizeCategory}
                    />

                    {/* Create Game Button */}
                    {isHost && ( // Render the button only if the player is the host
                        <HostControls
                            selectedModel={selectedModel}
                            onModelChange={handleDropdownChange}
                            onCreateGame={handleCreateGame}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default Lobby;