import React from "react";
import { Category, Clue } from "../types";

interface JeopardyGridProps {
    boardData: Category[];
    isHost: boolean;
    clearedClues: Set<string>;
    handleClueClick: (clue: Clue, clueId: string) => void;
    isFinalJeopardy: boolean;
}

const JeopardyGrid: React.FC<JeopardyGridProps> = ({
                                                       boardData,
                                                       isHost,
                                                       clearedClues,
                                                       handleClueClick,
                                                       isFinalJeopardy,
                                                   }) => {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${boardData.length}, 1fr)`,
                gridTemplateRows: `60px repeat(5, 1fr)`,
                gap: "10px",
                width: "98%",
                height: "98%",
            }}
        >
            {/* Render Category Headers */}
            {boardData.map((category, colIndex) => (
                <div
                    key={colIndex}
                    style={{
                        display: "flex",
                        marginTop: "10px",
                        justifyContent: "center",
                        alignItems: "center",
                        border: "2px solid #000",
                        backgroundColor: "#FFA500",
                        fontWeight: "bold",
                        textAlign: "center",
                        height: "100%", // Fill the category row height (60px)
                        fontSize: "1.5rem",
                    }}
                >
                    {category.category}
                </div>
            ))}

            {/* Render Clues */}
            {boardData.map((category, colIndex) =>
                category.values.map((clue, rowIndex) => {
                    const clueId = `${clue.value}-${clue.question}`;
                    const isCleared = clearedClues.has(clueId);

                    return (
                        <div
                            key={`${colIndex}-${rowIndex}`}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                border: "2px solid #000",
                                backgroundColor: isCleared ? "#d3d3d3" : "#FFD700",
                                textAlign: "center",
                                height: "100%",
                                fontSize: "2rem",
                                cursor: isHost && !isCleared ? "pointer" : "not-allowed",
                                gridColumn: colIndex + 1,
                                gridRow: rowIndex + 2,
                            }}
                            onClick={() => handleClueClick(clue, clueId)}
                        >
                            {isFinalJeopardy ? "Final Jeopardy!" : isCleared ? "" : `$${clue.value}`}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default JeopardyGrid;