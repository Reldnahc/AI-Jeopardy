import {useEffect, useState} from 'react';
import {useLocation, useParams} from 'react-router-dom';
import JeopardyBoard from '../components/JeopardyBoard';
import {Category, Clue} from "../types.ts";
import Sidebar from "../components/Sidebar.tsx";
import {DrawingPath} from "../utils/drawingUtils.tsx";
import FinalScoreScreen from "../components/FinalScoreScreen.tsx";
import {useWebSocket} from "../contexts/WebSocketContext.tsx";

export default function Game() {
    const {gameId} = useParams<{ gameId: string }>();
    const location = useLocation();
    const playerName = location.state?.playerName || 'Spectator';
    const [host, setHost] = useState<string | null>(null);
    const isHost = location.state?.isHost || false;
    const [players, setPlayers] = useState<string[]>([]);
    const [buzzResult, setBuzzResult] = useState<string | null>(null);
    const [isBuzzed, setIsBuzzed] = useState(false);
    const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
    const [clearedClues, setClearedClues] = useState<Set<string>>(new Set());
    const [buzzerLocked, setBuzzerLocked] = useState(true);
    const [activeBoard, setActiveBoard] = useState('firstBoard');
    const [copySuccess, setCopySuccess] = useState(false);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [buzzLockedOut, setBuzzLockedOut] = useState(false);//early buzz
    const [lastQuestionValue, setLastQuestionValue] = useState<number>(100);
    const [allWagersSubmitted, setAllWagersSubmitted] = useState(false);
    const [isFinalJeopardy, setIsFinalJeopardy] = useState(false);
    const [drawings, setDrawings] = useState<Record<string, DrawingPath[]> | null>(null);
    const [wagers, setWagers] = useState<Record<string, number>>({});
    const [isGameOver, setIsGameOver] = useState(false); // New state to track if Final Jeopardy is finished
    const [boardData, setBoardData] = useState(location.state?.boardData || {
        firstBoard: {},
        secondBoard: {},
        finalJeopardy: {}
    });

    // Persistent WebSocket connection
    const { socket, isSocketReady } = useWebSocket();

    useEffect(() => {
        document.title = 'Jeopardy! - ' + gameId;

        if (socket && isSocketReady) {

            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log(message);
                if (message.type === 'game-state') {
                    setPlayers(message.players);
                    setHost(message.host);
                    setBuzzResult(message.buzzResult ? `${message.buzzResult} buzzed first!` : null);
                    setIsBuzzed(!!message.buzzResult); // Disable the buzz button if someone already buzzed
                    setBoardData(message.boardData || null); // Set the board data dynamically
                    setScores(message.scores || {}); // Initialize scores

                    if (message.clearedClues) {
                        // Push cleared clues to an external state handler
                        updateClearedClues(message.clearedClues);
                    }
                    if (message.selectedClue) {
                        setSelectedClue({
                            ...message.selectedClue,
                            showAnswer: message.selectedClue.isAnswerRevealed || false,
                        });
                    }

                }

                if (message.type === 'final-jeopardy') {
                    setActiveBoard('finalJeopardy');
                    //setIsFinalJeopardy(true);
                }

                if (message.type === "wager-update") {
                    console.log(`Player ${message.player} submitted a wager of $${message.wager}`);
                }

                if (message.type === "all-wagers-submitted") {
                    const {wagers} = message;

                    console.log("All wagers have been submitted! Final Jeopardy can begin.");
                    setAllWagersSubmitted(true);
                    setWagers(wagers);
                    onClueSelected(boardData.finalJeopardy.categories[0].values[0]);
                }

                if (message.type === 'player-list-update') {
                    setPlayers(message.players);
                    setHost(message.host); // Add a separate state for the host
                }

                if (message.type === 'buzz-result') {
                    setBuzzResult(`${message.playerName} buzzed!!!`);
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
                    setBuzzerLocked(true);
                }

                if (message.type === 'game-over') {
                    setIsGameOver(true); // Switch to the Final Score Screen
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

                if (message.type === 'all-clues-cleared') {
                    const clearedClues = message.clearedClues; // Array of cleared clue IDs

                    if (clearedClues && Array.isArray(clearedClues)) {
                        setClearedClues(new Set(clearedClues)); // Update cleared clues state
                    }
                }

                if (message.type === 'clue-cleared') {
                    const {clueId} = message;
                    setClearedClues((prev) => new Set(prev).add(clueId));
                }

                if (message.type === 'returned-to-board') {
                    setSelectedClue(null); // Reset the selected clue
                    setBuzzResult(null);
                }

                if (message.type === 'transition-to-second-board') {
                    setActiveBoard('secondBoard'); // Switch to second board
                    setClearedClues(new Set()); // Reset cleared clues
                }

                if (message.type === 'update-scores') {
                    setScores(message.scores);
                }

                if (message.type === "all-final-jeopardy-drawings-submitted") {
                    const {drawings} = message;
                    setDrawings(drawings);
                    console.log("All players have submitted their drawings.");
                }

            };
        }

    }, [gameId, playerName, isHost, socket]);

    useEffect(() => {
        if (socket && isSocketReady) {
            socket.send(
                JSON.stringify({
                    type: 'update-cleared-clues',
                    gameId,
                    clearedClues: Array.from(clearedClues), // Send cleared clues to the server
                })
            );
        }

        if (
            activeBoard === 'firstBoard' &&
            boardData.firstBoard.categories.every((category: Category) =>
                category.values.every((clue) => clearedClues.has(`${clue.value}-${clue.question}`))
            )
        ) {
            if (socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'transition-to-second-board',
                        gameId,
                    })
                );
                setActiveBoard('secondBoard');
                setIsFinalJeopardy(false);

            }
        } else if (
            activeBoard === 'secondBoard' &&
            boardData.secondBoard.categories.every((category: Category) =>
                category.values.every((clue) => clearedClues.has(`${clue.value}-${clue.question}`))
            )
        ) {
            if (socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'transition-to-final-jeopardy',
                        gameId,
                    })
                );
                setActiveBoard('finalJeopardy');
                setIsFinalJeopardy(true);
            }

        }
    }, [clearedClues, gameId, activeBoard]); // Run only when clearedClues or gameId changes

    const updateClearedClues = (newClearedClues: string[]) => {
        setClearedClues((prev) => {
            const updatedClues = new Set(prev);
            newClearedClues.forEach((clue: string) => updatedClues.add(clue));
            return updatedClues;
        });
    };

    const handleScoreUpdate = (player: string, delta: number) => {
        if (isFinalJeopardy){
            delta = wagers[player];//TODO fix negative final jeopardy wagers
        }
        const newScores = {...scores, [player]: (scores[player] || 0) + delta};
        setScores(newScores);
        if (socket && isSocketReady) {
            // Emit score update to server
            socket.send(
                JSON.stringify({
                    type: 'update-score',
                    gameId,
                    player,
                    delta,
                })
            );
        }
    };

    const markAllCluesComplete = () => {
        if (socket && isSocketReady) {
            socket.send(
                JSON.stringify({
                    type: 'mark-all-complete',
                    gameId,
                })
            );

            // Update local state for cleared clues
            if (activeBoard === 'firstBoard') {
                const allClues = boardData.firstBoard.categories.flatMap((category: Category) =>
                    category.values.map((clue) => `${clue.value}-${clue.question}`)
                );
                setClearedClues(new Set(allClues));
            } else if (activeBoard === 'secondBoard') {
                const allClues = boardData.secondBoard.categories.flatMap((category: Category) =>
                    category.values.map((clue) => `${clue.value}-${clue.question}`)
                );
                setClearedClues(new Set(allClues.splice(0, 25)));
            }
        }
    };

    const handleBuzz = () => {
        if (isBuzzed || buzzLockedOut) return; // Prevent buzzing if temporarily locked out
        if (buzzerLocked) {
            setBuzzLockedOut(true); // Temporarily lock out the player

            // Unlock the player after 5 seconds
            setTimeout(() => {
                setBuzzLockedOut(false); // Reset lockout state
            }, 1000);

            return;
        }
        if (socket && isSocketReady) {
            socket.send(JSON.stringify({type: 'buzz', gameId, playerName}));
        }
    };

    const onClueSelected = (clue: Clue) => {
        if (isHost && clue) {
            if (socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: 'clue-selected',
                        gameId,
                        clue,
                    })
                );
            }
            setSelectedClue(clue); // Update the host's UI
            if (clue.value !== undefined) {
                setLastQuestionValue(clue.value); // Set last question value based on clue's value
            }
        }
    };

    if (!boardData) {
        return <p>Loading board... Please wait!</p>; // Display a loading message
    }

    return (
        <div
            style={{
                display: 'flex', // Flex layout for sidebar and Jeopardy board
                height: '100vh', // Full viewport height
                width: '100vw', // Full viewport width
                overflow: 'hidden', // No scrolling allowed
                fontFamily: 'Arial, sans-serif',
                background: 'linear-gradient(135deg, #2e3a59, #1c2538)',

            }}
        >
            <Sidebar
                gameId={gameId}
                isHost={isHost}
                host={host}
                players={players}
                scores={scores}
                buzzResult={buzzResult}
                isBuzzed={isBuzzed}
                buzzLockedOut={buzzLockedOut}
                copySuccess={copySuccess}
                buzzerLocked={buzzerLocked}
                lastQuestionValue={lastQuestionValue}
                selectedClue={selectedClue}
                activeBoard={activeBoard}
                isFinalJeopardy={isFinalJeopardy}
                setCopySuccess={setCopySuccess}
                setBuzzerLocked={setBuzzerLocked}
                setIsBuzzed={setIsBuzzed}
                setBuzzResult={setBuzzResult}
                handleScoreUpdate={handleScoreUpdate}
                markAllCluesComplete={markAllCluesComplete}
                handleBuzz={handleBuzz}
            />


            {/* Jeopardy Board Section */}
            <div
                style={{
                    flex: 1, // Take up the remaining space
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden', // Prevent scrolling issues for board
                    padding: '0px', // Add some space around the board
                }}
            >
                {isGameOver ? (
                    <FinalScoreScreen scores={scores} />
                ) : (
                    <>{/* Jeopardy Board */}
                        <JeopardyBoard
                            boardData={boardData[activeBoard].categories}
                            isHost={isHost}
                            onClueSelected={onClueSelected}
                            selectedClue={selectedClue || null}
                            gameId={gameId || ''}
                            clearedClues={clearedClues}
                            players={players}
                            scores={scores}
                            currentPlayer={playerName}
                            allWagersSubmitted={allWagersSubmitted}
                            isFinalJeopardy={isFinalJeopardy}
                            drawings={drawings}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
