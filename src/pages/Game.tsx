import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import JeopardyBoard from '../components/JeopardyBoard';

export default function Game() {
    const { gameId } = useParams<{ gameId: string }>();
    const location = useLocation();
    const playerName = location.state?.playerName || 'Unknown Player';
    //const boardData  = location.state?.boardData || null; // Destructure state

    const [host, setHost] = useState<string | null>(null);
    const isHost = location.state?.isHost || false;

    const [players, setPlayers] = useState<string[]>([]);
    const [buzzResult, setBuzzResult] = useState<string | null>(null);
    const [isBuzzed, setIsBuzzed] = useState(false);
    const [boardData, setBoardData] = useState(location.state?.boardData || null);
    const [selectedClue, setSelectedClue] = useState(null); // Track the currently selected clue
    const [clearedClues, setClearedClues] = useState<Set<string>>(new Set());
    const [buzzerLocked, setBuzzerLocked] = useState(true);

    // Persistent WebSocket connection
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Initialize WebSocket connection
        socketRef.current = new WebSocket('ws://localhost:3001');

        socketRef.current.onopen = () => {
            console.log('Connected to WebSocket');
            const action = isHost ? 'create-game' : 'join-game';
            socketRef.current?.send(JSON.stringify({ type: action, gameId, playerName,
                ...(isHost && { boardData }),}));
        };

        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'game-state') {
                console.log(message);
                setPlayers(message.players);
                setHost(message.host);
                setBuzzResult(message.buzzResult ? `${message.buzzResult} buzzed first!` : null);
                setIsBuzzed(!!message.buzzResult); // Disable the buzz button if someone already buzzed
                // Sync cleared clues from server
                setClearedClues(new Set(message.clearedClues || [])); // Initialize cleared clues
                setBoardData(message.boardData || null); // Set the board data dynamically
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
                        return { ...prevClue, showAnswer: true }; // Set showAnswer to true
                    }
                    return prevClue;
                });
            }

            if (message.type === 'clue-cleared') {
                const { clueId } = message;
                console.log('[Client] Clue cleared:', clueId); // Debugging log

                setClearedClues((prev) => new Set(prev).add(clueId));
            }


            if (message.type === 'returned-to-board') {
                setSelectedClue(null); // Reset the selected clue
            }

        };

        socketRef.current.onclose = () => {
            console.log('Disconnected from WebSocket');
        };

        return () => {
            // Close WebSocket connection on cleanup
            socketRef.current?.close();
        };
    }, [gameId, playerName, isHost]);

    const handleBuzz = () => {
        if (isBuzzed || buzzerLocked) return; // Prevent buzzing if locked or already buzzed

        socketRef.current?.send(JSON.stringify({ type: 'buzz', gameId, playerName }));
    };

    const onClueSelected = (clue) => {
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
                boardData={boardData}
                isHost={isHost}
                onClueSelected={onClueSelected}
                selectedClue={selectedClue}
                gameId={gameId}
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
