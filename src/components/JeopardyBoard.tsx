import React, { useEffect, useState } from 'react';
import {Clue} from "../types.ts";

interface Category {
    category: string;
    values: Clue[];
}

interface JeopardyBoardProps {
    boardData: Category[];
    isHost: boolean;
    onClueSelected: (clue: Clue) => void;
    selectedClue: Clue | null;
    gameId: string;
    socketRef: React.MutableRefObject<WebSocket | null>;
    clearedClues: Set<string>; // Add clearedClues
    players: string[];         // Prop to track players in the game
}

const JeopardyBoard: React.FC<JeopardyBoardProps> = ({ boardData, isHost, onClueSelected, selectedClue, gameId, socketRef, clearedClues, players}) => {
    const [localSelectedClue, setLocalSelectedClue] = useState<Clue | null>(null);
    const [showClue, setShowClue] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [hostCanSeeAnswer, setHostCanSeeAnswer] = useState(false);

    useEffect(() => {
        if (selectedClue) {
            const isOnlyPersonPlaying = players.length === 0;
            setLocalSelectedClue(selectedClue);
            setShowClue(true);

            // If the host should see the answer immediately (not the only player), enable answer display
            if (isHost && !isOnlyPersonPlaying) {
                setHostCanSeeAnswer(true); // Track that the host can see the answer
            } else {
                setShowAnswer(!!selectedClue.showAnswer); // Update based on the state of the clue
                setHostCanSeeAnswer(false); // Host can't see the answer pre-reveal if they are the only person playing
            }
        } else {
            setLocalSelectedClue(null);
            setShowClue(false);
            setShowAnswer(false);
        }
    }, [selectedClue, isHost, players]);

    const handleClueClick = (clue: Clue, clueId: string) => {
        if (isHost && clue && !localSelectedClue && !clearedClues.has(clueId)) {
            onClueSelected(clue);
        }
    };

    if (!boardData || boardData.length === 0) {
        return <p>No board data available.</p>; // Fallback if boardData is invalid
    }
    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%', // Fill vertically
                margin: '0', // Remove margins
                backgroundColor: '#fff',
                overflow: 'hidden',
            }}

        >
            {/* Jeopardy Board */}
            {!showClue && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${boardData.length}, 1fr)`, // One column for each category
                        gridTemplateRows: `60px repeat(5, 1fr)`, // 1 fixed row for categories, 5 flexible rows for clues
                        gap: '10px',
                        width: '98%',
                        height: '98%',
                    }}
                >
                    {/* Render Category Headers (First Row Only) */}
                    {boardData.map((category, colIndex) => (
                        <div
                            key={colIndex}
                            style={{
                                display: 'flex',
                                marginTop: '10px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '2px solid #000',
                                backgroundColor: '#FFA500',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                height: '100%', // Fill the category row height (60px)
                                fontSize: '1.5rem',
                            }}
                        >
                            {category.category}
                        </div>
                    ))}

                    {/* Render Clues Below the Categories (Starting from Row 2) */}
                    {boardData.map((category, colIndex) =>
                        category.values.map((clue, rowIndex) => {
                            const clueId = `${clue.value}-${clue.question}`;
                            const isCleared = clearedClues.has(clueId);

                            return (
                                <div
                                    key={`${colIndex}-${rowIndex}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        border: '2px solid #000',
                                        backgroundColor: isCleared ? '#d3d3d3' : '#FFD700',
                                        textAlign: 'center',
                                        height: '100%', // Auto height adapts based on grid row height
                                        fontSize: '2rem',
                                        cursor: isHost && !isCleared ? 'pointer' : 'not-allowed',
                                        gridColumn: colIndex + 1, // Place in the correct column
                                        gridRow: rowIndex + 2, // Start row 2 for clues
                                    }}
                                    onClick={() => handleClueClick(clue, clueId)}
                                >
                                    {isCleared ? '' : `$${clue.value}`}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Display Selected Clue */}
            {showClue && localSelectedClue && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#222',
                        color: '#FFF',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        zIndex: 10,
                        padding: '20px',
                    }}
                   // onClick={isHost ? handleClueDisplayClick : undefined}
                    // Attach the updated handler
                >
                    <div style={{ textAlign: 'center', cursor: 'pointer', width: '100%' }}>
                        {/* Question */}
                        <h1
                            style={{
                                fontSize: '2.5rem',
                                marginBottom: '20px',
                            }}
                        >
                            {localSelectedClue.question}
                        </h1>

                        {/* Reserve space for the answer */}
                        <div
                            style={{
                                minHeight: '70px', // Reserve enough height for the answer
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {(showAnswer || hostCanSeeAnswer) && (
                                <p
                                    style={{
                                        marginTop: '20px',
                                        fontSize: '1.5rem',
                                        color: '#FFD700',
                                    }}
                                >
                                    {localSelectedClue.answer}
                                </p>
                            )}
                        </div>

                        {/* Button to reveal answer or return to board */}
                        {isHost && (
                            <button
                                onClick={() => {
                                    if (!showAnswer) {
                                        // Reveal the answer
                                        setShowAnswer(true);
                                        const socket = socketRef.current;
                                        if (socket) {
                                            socket.send(
                                                JSON.stringify({
                                                    type: 'reveal-answer',
                                                    gameId,
                                                })
                                            );
                                        }
                                    } else {
                                        // Return to the board
                                        setShowClue(false);

                                        if (localSelectedClue) {
                                            const clueId = `${localSelectedClue.value}-${localSelectedClue.question}`;
                                            const socket = socketRef.current;

                                            if (socket) {
                                                socket.send(
                                                    JSON.stringify({
                                                        type: 'clue-cleared',
                                                        gameId,
                                                        clueId,
                                                    })
                                                );
                                                socket.send(
                                                    JSON.stringify({
                                                        type: 'return-to-board',
                                                        gameId,
                                                    })
                                                );
                                            }
                                        }

                                        setLocalSelectedClue(null);
                                    }
                                }}
                                style={{
                                    marginTop: '30px',
                                    padding: '20px 50px',
                                    backgroundColor: showAnswer ? '#FF8800' : '#007BFF', // Distinct colors for each action
                                    color: 'white',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    width: '300px',
                                    transition: 'background-color 0.3s ease',
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = showAnswer ? '#E06F00' : '#0056B3') // Hover effect
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = showAnswer ? '#FF8800' : '#007BFF') // Reset color
                                }
                            >
                                {showAnswer ? 'Return to Board' : 'Reveal Answer'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JeopardyBoard;