import { useEffect, useState, useRef} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import JeopardyBoard from '../components/JeopardyBoard';
import {Clue} from "../types.ts";

export default function Game() {
    const {gameId} = useParams<{ gameId: string }>();
    const location = useLocation();
    const playerName = location.state?.playerName || 'Unknown Player';

    const [host, setHost] = useState<string | null>(null);
    const isHost = location.state?.isHost || false;

    const [players, setPlayers] = useState<string[]>([]);
    const [buzzResult, setBuzzResult] = useState<string | null>(null);
    const [isBuzzed, setIsBuzzed] = useState(false);
    const [boardData, setBoardData] = useState(location.state?.boardData || { firstBoard: [], secondBoard: [] });
    const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
    const [clearedClues, setClearedClues] = useState<Set<string>>(new Set());
    const [buzzerLocked, setBuzzerLocked] = useState(true);
    const [activeBoard, setActiveBoard] = useState('firstBoard'); // Track which board is active


    // Persistent WebSocket connection
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Initialize WebSocket connection

        socketRef.current = new WebSocket('https://c469-71-34-19-23.ngrok-free.app');



        socketRef.current.onopen = () => {
            console.log('Connected to WebSocket');
            const action = isHost ? 'create-game' : 'join-game';
            socketRef.current?.send(JSON.stringify({
                type: action, gameId, playerName,
                ...(isHost && {boardData}),
            }));
        };


        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'game-state') {
                console.log(message);
                setPlayers(message.players);
                setHost(message.host);
                setBuzzResult(message.buzzResult ? `${message.buzzResult} buzzed first!` : null);
                setIsBuzzed(!!message.buzzResult); // Disable the buzz button if someone already buzzed
                setBoardData(message.boardData || null); // Set the board data dynamically

                if (message.clearedClues) {
                    // Push cleared clues to an external state handler
                    updateClearedClues(message.clearedClues);
                }

            }

            if (message.type === 'player-list-update') {
                setPlayers(message.players);
                setHost(message.host); // Add a separate state for the host
            }

            if (message.type === 'buzz-result') {
                setBuzzResult(`${message.playerName} buzzed first!`);
                setIsBuzzed(true);
            }

            if (message.type === 'reset-buzzer') {
                setBuzzResult(null);
                setIsBuzzed(false);
            }

            if (message.type === 'buzzer-locked') {
                setBuzzerLocked(true);
            }

            if (message.type === 'buzzer-unlocked') {
                setBuzzerLocked(false);
            }

            if (message.type === 'reset-buzzer') {
                setBuzzResult(null);
                setIsBuzzed(false);
            }

            if (message.type === 'clue-selected') {
                // Update the selected clue
                setSelectedClue({
                    ...message.clue,
                    showAnswer: false, // Initialize as false when selected
                });

                // Sync cleared clues (received from the server)
                if (message.clearedClues) {
                    setClearedClues(new Set(message.clearedClues)); // Convert array back to a Set
                }
            }

            if (message.type === 'answer-revealed') {
                setSelectedClue((prevClue) => {
                    if (prevClue) {
                        return {...prevClue, showAnswer: true}; // Set showAnswer to true
                    }
                    return prevClue;
                });
            }

            if (message.type === 'clue-cleared') {
                const {clueId} = message;
                console.log('[Client] Clue cleared:', clueId); // Debugging log

                setClearedClues((prev) => new Set(prev).add(clueId));
            }


            if (message.type === 'returned-to-board') {
                setSelectedClue(null); // Reset the selected clue
            }

            if (message.type === 'transition-to-second-board') {
                setActiveBoard('secondBoard'); // Switch to second board
                setClearedClues(new Set()); // Reset cleared clues
            }

        };

        socketRef.current.onclose = () => {
            console.log('Disconnected from WebSocket');
        };

        return () => {
            // Close WebSocket connection on cleanup
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [gameId, playerName, isHost]);

    useEffect(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(
                JSON.stringify({
                    type: 'update-cleared-clues',
                    gameId,
                    clearedClues: Array.from(clearedClues), // Send cleared clues to the server
                })
            );
        }

        if (
            activeBoard === 'firstBoard' &&
            boardData.firstBoard.every((category: { values: any[]; }) =>
                category.values.every((clue) => clearedClues.has(`${clue.value}-${clue.question}`))
            )
        ) {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current?.send(
                    JSON.stringify({
                        type: 'transition-to-second-board',
                        gameId,
                    })
                );
                setActiveBoard('secondBoard');
            }
        }

    }, [clearedClues, gameId]); // Run only when clearedClues or gameId changes

    const updateClearedClues = (newClearedClues) => {
        setClearedClues((prev) => {
            const updatedClues = new Set(prev);
            newClearedClues.forEach((clue) => updatedClues.add(clue));
            return updatedClues;
        });
    };


    const handleBuzz = () => {
        if (isBuzzed || buzzerLocked) return; // Prevent buzzing if locked or already buzzed

        socketRef.current?.send(JSON.stringify({type: 'buzz', gameId, playerName}));
    };

    const onClueSelected = (clue: Clue) => {
        if (isHost && clue) {
            socketRef.current?.send(
                JSON.stringify({
                    type: 'clue-selected',
                    gameId,
                    clue,
                })
            );

            setSelectedClue(clue); // Update the host's UI
        }
    };

    if (!boardData) {
        return <p>Loading board... Please wait!</p>; // Display a loading message
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <p>
                <strong>Game ID:</strong> {gameId}
            </p>
            <p>
                <strong>Host:</strong> {isHost ? 'You' : host || 'Unknown'}
            </p>
            <h2>Players:</h2>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>{player}</li>
                ))}
            </ul>
            <JeopardyBoard
                boardData={boardData[activeBoard]}
                isHost={isHost}
                onClueSelected={onClueSelected}
                selectedClue={selectedClue || null}
                gameId={gameId || ''}
                clearedClues={clearedClues}
                socketRef={socketRef}
            />
            {/** Buzzer controls for the host */}
            {isHost && selectedClue && (
                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={() => {
                            socketRef.current?.send(JSON.stringify({ type: 'unlock-buzzer', gameId }));
                            setBuzzerLocked(false); // Optimistic UI update for the host
                        }}
                        style={{
                            padding: '10px 20px',
                            marginRight: '10px',
                            backgroundColor: buzzerLocked ? 'green' : 'gray',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: buzzerLocked ? 'pointer' : 'not-allowed',
                        }}
                        disabled={!buzzerLocked} // Disable the button if the buzzer is already unlocked
                    >
                        Unlock Buzzer
                    </button>
                </div>
            )}
            {/** Player buzzer button */}
            {!isHost && (
                <button
                    onClick={handleBuzz}
                    disabled={isBuzzed || buzzerLocked}
                    style={{
                        padding: '10px 20px',
                        marginTop: '20px',
                        backgroundColor: isBuzzed || buzzerLocked ? 'gray' : 'blue',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isBuzzed || buzzerLocked ? 'not-allowed' : 'pointer',
                    }}
                >
                    Buzz!
                </button>
            )}
            {buzzResult && <p style={{ color: 'green', marginTop: '20px' }}>{buzzResult}</p>}
        </div>
    );
}
