import React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import {convertToSVG, DrawingPath} from "../utils/drawingUtils";
import { Clue } from "../types";

interface SelectedClueDisplayProps {
    localSelectedClue: Clue;
    showAnswer: boolean;
    setShowAnswer: (value: boolean) => void;
    setShowClue: (value: boolean) => void;
    isHost: boolean;
    isFinalJeopardy: boolean;
    gameId: string;
    currentPlayer: string;
    socketRef: React.MutableRefObject<WebSocket | null>;
    // @ts-expect-error how its done.
    canvasRef: React.RefObject<ReactSketchCanvas>;
    drawings: Record<string, DrawingPath[]> | null;
    drawingSubmitted: Record<string, boolean>;
    setDrawingSubmitted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    hostCanSeeAnswer: boolean;
}

const SelectedClueDisplay: React.FC<SelectedClueDisplayProps> = ({
                                                                     localSelectedClue,
                                                                     showAnswer,
                                                                     setShowAnswer,
                                                                     setShowClue,
                                                                     isHost,
                                                                     isFinalJeopardy,
                                                                     gameId,
                                                                     currentPlayer,
                                                                     socketRef,
                                                                     canvasRef,
                                                                     drawings,
                                                                     drawingSubmitted,
                                                                     setDrawingSubmitted,
                                                                     hostCanSeeAnswer,
                                                                 }) => (
    <div
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#222",
            color: "#FFF",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: 10,
            padding: "20px",
        }}
    >
        <div style={{ textAlign: "center", cursor: "pointer", width: "100%" }}>
            {/* Question */}
            <h1
                style={{
                    fontSize: "2.5rem",
                    marginBottom: "20px",
                }}
            >
                {localSelectedClue.question}
            </h1>

            {/* Reserve space for the answer */}
            <div
                style={{
                    minHeight: "100px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {(showAnswer || hostCanSeeAnswer) && (
                    <p
                        style={{
                            marginTop: "20px",
                            fontSize: "2rem",
                            color: "#FFD700",
                        }}
                    >
                        {localSelectedClue.answer}
                    </p>
                )}
            </div>

            {!isHost && isFinalJeopardy && drawingSubmitted[currentPlayer] && !drawings && (
                <p>Answer Submitted, waiting for others...</p>
            )}

            {!isHost && isFinalJeopardy && !drawingSubmitted[currentPlayer] && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#222",
                        color: "#fff",
                        padding: "20px",
                    }}
                >
                    <h2 style={{ marginBottom: "20px" }}>Write Your Answer</h2>

                    <ReactSketchCanvas
                        ref={canvasRef}
                        style={{
                            border: "2px solid white",
                            borderRadius: "8px",
                            backgroundColor: "white",
                        }}
                        width="700px"
                        height="250px"
                        strokeWidth={4}
                        strokeColor="black"
                    />

                    <div style={{ marginTop: "20px" }}>
                        {/* Clear Canvas */}
                        <button
                            onClick={() => canvasRef.current?.clearCanvas()}
                            style={{
                                marginRight: "10px",
                                padding: "10px 20px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#f55",
                                color: "white",
                                cursor: "pointer",
                            }}
                        >
                            Clear
                        </button>

                        {/* Submit Drawing */}
                        <button
                            onClick={() => {
                                canvasRef.current?.exportPaths().then((paths: string) => {
                                    const drawingData = JSON.stringify(paths);
                                    const socket = socketRef.current;

                                    if (socket) {
                                        socket.send(
                                            JSON.stringify({
                                                type: "final-jeopardy-drawing",
                                                gameId,
                                                player: currentPlayer,
                                                drawing: drawingData,
                                            })
                                        );
                                    }

                                    if (!drawingSubmitted[currentPlayer]) {
                                        setDrawingSubmitted((prev) => ({
                                            ...prev,
                                            [currentPlayer]: true,
                                        }));
                                    }
                                });
                            }}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#58a",
                                color: "white",
                                cursor: "pointer",
                            }}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            )}

            {/* Button to reveal answer or return to board */}
            {isHost && (
                <button
                    disabled={isFinalJeopardy && !drawings}
                    onClick={() => {
                        if (!showAnswer) {
                            setShowAnswer(true);
                            const socket = socketRef.current;

                            if (socket) {
                                socket.send(
                                    JSON.stringify({
                                        type: "reveal-answer",
                                        gameId,
                                    })
                                );
                            }
                        } else {
                            setShowClue(false);

                            const socket = socketRef.current;

                            if (localSelectedClue && socket) {
                                const clueId = `${localSelectedClue.value}-${localSelectedClue.question}`;

                                socket.send(
                                    JSON.stringify({
                                        type: "clue-cleared",
                                        gameId,
                                        clueId,
                                    })
                                );

                                socket.send(
                                    JSON.stringify({
                                        type: "return-to-board",
                                        gameId,
                                    })
                                );

                                if (isFinalJeopardy) {
                                    socket.send(
                                        JSON.stringify({
                                            type: "trigger-game-over",
                                            gameId,
                                        })
                                    );
                                }
                            }
                        }
                    }}
                    style={{
                        marginTop: "30px",
                        padding: "20px 50px",
                        backgroundColor: isFinalJeopardy && !drawings ? "#AAAAAA" : showAnswer ? "#FF8800" : "#007BFF",
                        color: "white",
                        fontSize: "24px",
                        fontWeight: "bold",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        width: "300px",
                        transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isFinalJeopardy && !drawings
                            ? "#AAAAAA"
                            : showAnswer
                                ? "#E06F00"
                                : "#0056B3";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isFinalJeopardy && !drawings
                            ? "#AAAAAA"
                            : showAnswer
                                ? "#FF8800"
                                : "#007BFF";
                    }}
                >
                    {isFinalJeopardy && !drawings
                        ? "Waiting for answers"
                        : showAnswer
                            ? "Return to Board"
                            : "Reveal Answer"}
                </button>
            )}

            {drawings &&
                !Array.isArray(drawings) &&
                Object.entries(drawings).map(([player, drawingString]) => (
                    <div key={player} style={{ marginBottom: "20px", zIndex: 0 }}>
                        <h2>{player}'s answer:</h2>
                        {convertToSVG(drawingString)}
                    </div>
                ))}
        </div>
    </div>
);

export default SelectedClueDisplay;