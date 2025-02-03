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
            className={`grid gap-2 w-[98%] h-[98%] mt-2`}
            style={{
                gridTemplateColumns: `repeat(${boardData.length}, 1fr)`,
                gridTemplateRows: `repeat(6, 1fr)`, // Updated to have all rows including headers be equal height
            }}
        >
            {/* Render Category Headers (Styled same as clues but non-clickable) */}
            {boardData.map((category, colIndex) => (
                <div
                    key={colIndex}
                    className={`flex justify-center items-center border-2 border-black text-center h-full text-4xl bg-indigo-600 cursor-not-allowed`}
                    style={{
                        pointerEvents: "none", // Disable all pointer interactions for category headers
                        gridColumn: colIndex + 1,
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
                            className={`flex justify-center items-center border-2 border-black text-center h-full text-3xl text-yellow-500 ${
                                isCleared ? "bg-gray-300" : "bg-indigo-600"
                            } ${isHost && !isCleared ? "cursor-pointer" : "cursor-not-allowed"}`}
                            style={{
                                gridColumn: colIndex + 1, // Tailwind won't dynamically handle grid columns/rows.
                                gridRow: rowIndex + 2, // Clues always start from the 2nd row
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