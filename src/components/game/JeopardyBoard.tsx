import React, { useEffect, useRef, useState} from 'react';
import {Category, Clue} from "../../types.ts";
import JeopardyGrid from "./JeopardyGrid.tsx"; // Import the grid component
import WagerInput from "./WagerInput.tsx"; // Import the wager input component
import { DrawingPath} from "../../utils/drawingUtils.tsx";
import SelectedClueDisplay from "./SelectedClueDisplay.tsx";
import {useWebSocket} from "../../contexts/WebSocketContext.tsx";
import {Player} from "../../types/Lobby.ts";
import {useAlert} from "../../contexts/AlertContext.tsx"; // Import the selected clue component

interface JeopardyBoardProps {
    boardData: Category[];
    isHost: boolean;
    onClueSelected: (clue: Clue) => void;
    selectedClue: Clue | null;
    gameId: string;
    clearedClues: Set<string>; // Add clearedClues
    players: Player[];         // Prop to track players in the game
    scores: Record<string, number>; // Player scores
    currentPlayer: string; // New prop for the current player
    allWagersSubmitted: boolean;
    isFinalJeopardy: boolean;
    drawings: Record<string, DrawingPath[]> | null;
    setBuzzerLocked: React.Dispatch<React.SetStateAction<boolean>>;
    setBuzzResult: React.Dispatch<React.SetStateAction<string | null>>;
    handleBuzz: () => void;
    buzzerLocked: boolean;
    buzzResult: string | null;
    buzzLockedOut: boolean;
    timerEndTime: number | null;
    timerDuration: number;
    showAnswer: boolean;
    setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;

}

const JeopardyBoard: React.FC<JeopardyBoardProps> =
    ({ boardData, isHost, onClueSelected, selectedClue, gameId, clearedClues, players, scores,
         currentPlayer, allWagersSubmitted, isFinalJeopardy, drawings, setBuzzerLocked,
         setBuzzResult, handleBuzz, buzzerLocked, buzzResult, buzzLockedOut, timerEndTime, timerDuration,
         showAnswer, setShowAnswer }) => {
    const [localSelectedClue, setLocalSelectedClue] = useState<Clue | null>(null);
    const [showClue, setShowClue] = useState(false);
    const [hostCanSeeAnswer, setHostCanSeeAnswer] = useState(false);
    const [wagers, setWagers] = useState<Record<string, number>>({});
    const [wagerSubmitted, setWagerSubmitted] = useState<string[]>([]);
    const [drawingSubmitted, setDrawingSubmitted] = useState<Record<string, boolean>>({});
    const { socket, isSocketReady } = useWebSocket();
    const { showAlert } = useAlert();

        // @ts-expect-error works better this way
    const canvasRef = useRef< ReactSketchCanvas>(null);
    const canvas_with_mask = document.querySelector("#react-sketch-canvas__stroke-group-0");
    if (canvas_with_mask)
        canvas_with_mask.removeAttribute("mask");

    // Automatically submit $0 wager upfront if the player has $0 or less
    useEffect(() => {
        if (isHost)
            return;
        console.log(isFinalJeopardy);
        console.log(scores[currentPlayer]);
        if (isFinalJeopardy && (scores[currentPlayer] <= 0 || !scores[currentPlayer]) && !wagerSubmitted.includes(currentPlayer)) {
            submitWager(currentPlayer);
        }
    }, [currentPlayer, scores, wagerSubmitted, isFinalJeopardy]);

    useEffect(() => {
        if (selectedClue) {
            const isOnlyPersonPlaying = players.length === 1 && isHost;
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
        console.log(localSelectedClue);
        if (isHost && clue && !localSelectedClue && !clearedClues.has(clueId)) {
            onClueSelected(clue);
        }
    };

    const handleWagerChange = (player: string, wager: number) => {
        setWagers((prev) => ({ ...prev, [player]: wager }));
    };

    const submitWager = (player: string) => {
        if (wagers[player] === undefined) {
            wagers[player] = 0;
        }
        console.log(scores);
        console.log(player);
        console.log(scores[player]);
        if (wagers[player] !== undefined && wagers[player] <= (scores[player] || 0)) {
            setWagerSubmitted((prev) => [...prev, player]);

            // Notify the server that the wager is submitted
            if (socket && isSocketReady) {
                socket.send(
                    JSON.stringify({
                        type: "submit-wager",
                        gameId,
                        player,
                        wager: wagers[player],
                    })
                );
            }
        } else {
            showAlert(
                <span>
                    <span className="text-red-500 font-bold text-xl">Wager cannot exceed current score!</span><br/>
                </span>,
                [
                    {
                        label: "Okay",
                        actionValue: "okay",
                        styleClass: "bg-green-500 text-white hover:bg-green-600",
                    }]
            );
        }
    };


    if (!boardData || boardData.length === 0) {
        return <p>No board data available.</p>; // Handle invalid board data
    }

        return (
            <div
                className="relative w-full h-full m-0 overflow-hidden"
            >
                {isFinalJeopardy && !allWagersSubmitted && (
                    <div
                        className="flex flex-col items-center justify-center w-full h-full bg-gray-800 text-white"
                    >
                        <h2 className="text-2xl">Final Jeopardy Category:</h2>
                        <h1 className="text-6xl">{boardData[0].category}</h1>

                        <h2 className="text-2xl">Place Your Wager!</h2>
                        <WagerInput
                            players={players}
                            currentPlayer={currentPlayer}
                            isHost={isHost}
                            scores={scores}
                            wagers={wagers}
                            wagerSubmitted={wagerSubmitted}
                            handleWagerChange={handleWagerChange}
                            submitWager={submitWager}
                        />
                    </div>
                )}

                {/* Jeopardy Board */}
                {!showClue && !isFinalJeopardy && (
                    <JeopardyGrid
                        boardData={boardData}
                        isHost={isHost}
                        clearedClues={clearedClues}
                        handleClueClick={handleClueClick}
                        isFinalJeopardy={isFinalJeopardy}
                    />
                )}

                {/* Display Selected Clue */}
                {showClue && localSelectedClue && (
                    <SelectedClueDisplay
                        localSelectedClue={localSelectedClue}
                        showAnswer={showAnswer}
                        setShowAnswer={setShowAnswer}
                        setShowClue={setShowClue}
                        isHost={isHost}
                        isFinalJeopardy={isFinalJeopardy}
                        gameId={gameId}
                        currentPlayer={currentPlayer}
                        canvasRef={canvasRef}
                        drawings={drawings}
                        drawingSubmitted={drawingSubmitted}
                        setDrawingSubmitted={setDrawingSubmitted}
                        hostCanSeeAnswer={hostCanSeeAnswer}
                        players={players}
                        setBuzzerLocked={setBuzzerLocked}
                        setBuzzResult={setBuzzResult}
                        handleBuzz={handleBuzz}
                        buzzerLocked={buzzerLocked}
                        buzzResult={buzzResult}
                        buzzLockedOut={buzzLockedOut}
                        timerEndTime={timerEndTime}
                        timerDuration={timerDuration}
                    />
                )}
            </div>
        );
};

export default JeopardyBoard;