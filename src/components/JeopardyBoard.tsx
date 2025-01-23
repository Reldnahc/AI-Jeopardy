import React, { useEffect, useState } from 'react';

interface Clue {
    showAnswer: boolean;
    value: number;
    question: string;
    answer: string;
}

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
}

const JeopardyBoard: React.FC<JeopardyBoardProps> = ({ boardData, isHost, onClueSelected, selectedClue, gameId, socketRef, clearedClues}) => {
    const [localSelectedClue, setLocalSelectedClue] = useState<Clue | null>(null);
    const [showClue, setShowClue] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);


    useEffect(() => {
        if (selectedClue) {
            setLocalSelectedClue(selectedClue);
            setShowClue(true);

            // Sync the local state with showAnswer
            setShowAnswer(!!selectedClue.showAnswer); // Convert to boolean
        } else {
            setLocalSelectedClue(null);
            setShowClue(false);
            setShowAnswer(false);
        }
    }, [selectedClue]);

    const handleClueClick = (clue: Clue, clueId: string) => {
        if (isHost && clue && !localSelectedClue && !clearedClues.has(clueId)) {
            onClueSelected(clue);
        }
    };

    const handleClueDisplayClick = () => {
        if (!isHost) return; // Restrict click actions to the host only
        const socket = socketRef.current;

        if (!showAnswer) {
            // Step 1: Reveal the answer (first click)
            setShowAnswer(true);

            if (socket) {
                socket.send(
                    JSON.stringify({
                        type: 'reveal-answer', // Notify the server to reveal the answer
                        gameId,
                    })
                );
            }
        } else {
            // Step 2: Return to the board (second click)
            setShowClue(false); // Hide the clue modal

            if (localSelectedClue) {
                const clueId = `${localSelectedClue.value}-${localSelectedClue.question}`;

                if (socket) {
                    socket.send(
                        JSON.stringify({
                            type: 'clue-cleared', // Notify the server the clue has been cleared
                            gameId,
                            clueId,
                        })
                    );
                }
            }

            setLocalSelectedClue(null); // Clear local clue

            if (socket) {
                socket.send(
                    JSON.stringify({
                        type: 'return-to-board', // Notify the server to return to the board
                        gameId,
                    })
                );
            }
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
                maxWidth: '1200px',
                margin: '0 auto',
                height: '700px',
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
                        gap: '5px',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {/* Render Category Headers (First Row Only) */}
                    {boardData.map((category, colIndex) => (
                        <div
                            key={colIndex}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '2px solid #000',
                                backgroundColor: '#FFA500',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                height: '100%', // Fill the category row height (60px)
                                fontSize: '1.25rem',
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
                                        fontSize: '1.25rem',
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
                    onClick={isHost ? handleClueDisplayClick : undefined}
                    // Attach the updated handler


                >
                    <div style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{localSelectedClue.question}</h1>

                        {showAnswer && (
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
                </div>
            )}
        </div>
    );
};

export default JeopardyBoard;