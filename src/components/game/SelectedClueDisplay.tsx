import React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { convertToSVG, DrawingPath } from "../../utils/drawingUtils.tsx";
import { Clue } from "../../types.ts";
import { useWebSocket } from "../../contexts/WebSocketContext.tsx";
import {Player} from "../../types/Lobby.ts";

interface SelectedClueDisplayProps {
    localSelectedClue: Clue;
    showAnswer: boolean;
    setShowAnswer: (value: boolean) => void;
    setShowClue: (value: boolean) => void;
    isHost: boolean;
    isFinalJeopardy: boolean;
    gameId: string;
    currentPlayer: string;
    // @ts-expect-error sketch type of issue
    canvasRef: React.RefObject<ReactSketchCanvas>;
    drawings: Record<string, DrawingPath[]> | null;
    drawingSubmitted: Record<string, boolean>;
    setDrawingSubmitted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    hostCanSeeAnswer: boolean;
    players: Player[];
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
                                                                     canvasRef,
                                                                     drawings,
                                                                     drawingSubmitted,
                                                                     setDrawingSubmitted,
                                                                     hostCanSeeAnswer,
                                                                     players
                                                                 }) => {
    const { socket, isSocketReady } = useWebSocket();

    return (
        <div className="absolute inset-0  text-white flex flex-col justify-center items-center z-10 p-5">
            <div className="text-center cursor-pointer w-full">
                {/* Question */}
                <h1 className="text-4xl mb-5 max-w-3xl mx-auto">{localSelectedClue.question}</h1>

                {/* Reserve space for the answer */}
                <div className="min-h-[100px] flex justify-center items-center">
                    {(showAnswer || hostCanSeeAnswer) && (
                        <p className="mt-5 text-3xl text-yellow-300">{localSelectedClue.answer}</p>
                    )}
                </div>

                {!isHost && isFinalJeopardy && drawingSubmitted[currentPlayer] && !drawings && (
                    <p>Answer Submitted, waiting for others...</p>
                )}

                {(!isHost || players.length === 1) && isFinalJeopardy && !drawingSubmitted[currentPlayer] && (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-800 text-white p-5">
                        <h2 className="mb-5">Write Your Answer</h2>

                        <ReactSketchCanvas
                            ref={canvasRef}
                            className="border-2 border-white rounded-lg bg-white"
                            width="700px"
                            height="250px"
                            strokeWidth={4}
                            strokeColor="black"
                        />

                        <div className="mt-5">
                            {/* Clear Canvas */}
                            <button
                                onClick={() => canvasRef.current?.clearCanvas()}
                                className="mr-2 px-5 py-2 rounded-lg bg-red-500 text-white cursor-pointer"
                            >
                                Clear
                            </button>

                            {/* Submit Drawing */}
                            <button
                                onClick={() => {
                                    canvasRef.current?.exportPaths().then((paths: string) => {
                                        const drawingData = JSON.stringify(paths);

                                        if (socket && isSocketReady) {
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
                                className="px-5 py-2 rounded-lg bg-blue-500 text-white cursor-pointer"
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
                                if (socket && isSocketReady) {
                                    socket.send(
                                        JSON.stringify({
                                            type: "reveal-answer",
                                            gameId,
                                        })
                                    );
                                }
                            } else {
                                setShowClue(false);

                                if (localSelectedClue && socket && isSocketReady) {
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
                        className={`mt-8 px-12 py-5 rounded-xl font-bold text-xl shadow-2xl text-white transition duration-300 ease-in-out ${
                            isFinalJeopardy && !drawings
                                ? "bg-gray-400 cursor-not-allowed"
                                : showAnswer
                                    ? "bg-green-500 hover:bg-green-700"
                                    : "bg-blue-700 hover:bg-blue-900"
                        }`}
                    >
                        {isFinalJeopardy && !drawings
                            ? "Waiting for answers"
                            : showAnswer
                                ? "Return to Board"
                                : "Reveal Answer"}
                    </button>
                )}

                <div className="flex flex-wrap gap-4">
                    {drawings &&
                        !Array.isArray(drawings) &&
                        Object.entries(drawings).map(([player, drawingString]) => (
                            <div key={player} className="mb-5 z-0 w-auto">
                                <div className="flex flex-col items-center">
                                    {/* Customize avatar display */}
                                    <h2 className="text-center text-sm font-semibold mb-2">{player}'s answer:</h2>
                                    {convertToSVG(drawingString)}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default SelectedClueDisplay;