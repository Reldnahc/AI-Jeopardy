import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import JeopardyBoard from '../components/JeopardyBoard';

export default function Game() {
    const { gameId } = useParams<{ gameId: string }>();
    const location = useLocation();
    const playerName = location.state?.playerName || 'Unknown Player';
    const [host, setHost] = useState<string | null>(null);
    const isHost = location.state?.isHost || false;

    const [players, setPlayers] = useState<string[]>([]);
    const [buzzResult, setBuzzResult] = useState<string | null>(null);
    const [isBuzzed, setIsBuzzed] = useState(false);
    const [selectedClue, setSelectedClue] = useState(null); // Track the currently selected clue
    const [clearedClues, setClearedClues] = useState<Set<string>>(new Set());
    const [buzzerLocked, setBuzzerLocked] = useState(true);

    const boardData = [
        {
            category: 'History',
            values: [
                { value: 100, question: "This man was the first President of the United States.", answer: "Who is George Washington?" },
                { value: 200, question: "The year World War II ended.", answer: "What is 1945?" },
                { value: 300, question: "She was known as the 'Maid of Orleans'.", answer: "Who is Joan of Arc?" },
                { value: 400, question: "This country is home to the Great Wall.", answer: "What is China?" },
                { value: 500, question: "The name of the ship the Pilgrims sailed on to America.", answer: "What is the Mayflower?" },
            ],
        },
        {
            category: 'Science',
            values: [
                { value: 100, question: "This planet is known as the Red Planet.", answer: "What is Mars?" },
                { value: 200, question: "The boiling point of water in Celsius.", answer: "What is 100?" },
                { value: 300, question: "The gas that plants absorb from the atmosphere.", answer: "What is carbon dioxide?" },
                { value: 400, question: "The chemical symbol for gold.", answer: "What is Au?" },
                { value: 500, question: "The largest internal organ in the human body.", answer: "What is the liver?" },
            ],
        },
        {
            category: 'Literature',
            values: [
                { value: 100, question: "He wrote 'Romeo and Juliet'.", answer: "Who is William Shakespeare?" },
                { value: 200, question: "The girl who goes to Wonderland.", answer: "Who is Alice?" },
                { value: 300, question: "This author wrote the 'Harry Potter' series.", answer: "Who is J.K. Rowling?" },
                { value: 400, question: "The title of the book where a young boy befriends a spider named Charlotte.", answer: "What is 'Charlotte's Web'?" },
                { value: 500, question: "He wrote 'The Picture of Dorian Gray'.", answer: "Who is Oscar Wilde?" },
            ],
        },
        {
            category: 'Sports',
            values: [
                { value: 100, question: "This sport is often referred to as 'the beautiful game'.", answer: "What is soccer (football)?" },
                { value: 200, question: "The number of players on a basketball team on the court.", answer: "What is 5?" },
                { value: 300, question: "In tennis, this is the term for a score of zero.", answer: "What is love?" },
                { value: 400, question: "This country won the FIFA World Cup in 2018.", answer: "What is France?" },
                { value: 500, question: "In this sport, you would find an 'end'.", answer: "What is curling?" },
            ],
        },
        {
            category: 'Music',
            values: [
                { value: 100, question: "He is known as the 'King of Pop'.", answer: "Who is Michael Jackson?" },
                { value: 200, question: "The term for a group of five musicians.", answer: "What is a quintet?" },
                { value: 300, question: "He composed the 'Moonlight Sonata'.", answer: "Who is Ludwig van Beethoven?" },
                { value: 400, question: "The highest male singing voice.", answer: "What is tenor?" },
                { value: 500, question: "The lead singer of the band Queen.", answer: "Who is Freddie Mercury?" },
            ],
        },
    ];

    // Persistent WebSocket connection
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Initialize WebSocket connection
        socketRef.current = new WebSocket('ws://localhost:3001');

        socketRef.current.onopen = () => {
            console.log('Connected to WebSocket');
            const action = isHost ? 'create-game' : 'join-game';
            socketRef.current?.send(JSON.stringify({ type: action, gameId, playerName }));
        };

        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'game-state') {
                setPlayers(message.players);
                setHost(message.host);
                setBuzzResult(message.buzzResult ? `${message.buzzResult} buzzed first!` : null);
                setIsBuzzed(!!message.buzzResult); // Disable the buzz button if someone already buzzed
                // Sync cleared clues from server
                setClearedClues(new Set(message.clearedClues || [])); // Initialize cleared clues
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


    const handleResetBuzzer = () => {
        // Send reset event to the server
        socketRef.current?.send(JSON.stringify({ type: 'reset-buzzer', gameId }));
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
