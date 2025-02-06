import React from "react";
import { Clue } from "../../types.ts";
import {useWebSocket} from "../../contexts/WebSocketContext.tsx";
import {useProfile} from "../../contexts/ProfileContext.tsx";
import Avatar from "../common/Avatar.tsx";
import {Player} from "../../types/Lobby.ts";

interface SidebarProps {
    gameId: string | undefined;
    isHost: boolean;
    host: string | null;
    players: Player[];
    scores: Record<string, number>;
    buzzResult: string | null;
    isBuzzed: boolean;
    buzzLockedOut: boolean;
    copySuccess: boolean;
    buzzerLocked: boolean;
    lastQuestionValue: number;
    selectedClue: Clue | null;
    activeBoard: string;
    isFinalJeopardy: boolean;
    setCopySuccess: React.Dispatch<React.SetStateAction<boolean>>;
    setBuzzerLocked: React.Dispatch<React.SetStateAction<boolean>>;
    setIsBuzzed: React.Dispatch<React.SetStateAction<boolean>>;
    setBuzzResult: React.Dispatch<React.SetStateAction<string | null>>;
    handleScoreUpdate: (player: string, delta: number) => void;
    markAllCluesComplete: () => void;
    handleBuzz: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
                                             gameId,
                                             isHost,
                                             host,
                                             players,
                                             scores,
                                             buzzResult,
                                             copySuccess,
                                             isBuzzed,
                                             buzzLockedOut,
                                             buzzerLocked,
                                             lastQuestionValue,
                                             selectedClue,
                                             activeBoard,
                                             isFinalJeopardy,
                                             setCopySuccess,
                                             setBuzzerLocked,
                                             setIsBuzzed,
                                             setBuzzResult,
                                             handleScoreUpdate,
                                             markAllCluesComplete,
                                             handleBuzz,
                                         }) => {

    const { socket, isSocketReady } = useWebSocket();
    const { profile } = useProfile();

    const copyGameIdToClipboard = () => {
        if (gameId) {
            navigator.clipboard.writeText(gameId); // Copy Game ID to clipboard
            setCopySuccess(true); // Show toast
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <div className="flex-none w-full md:w-72 flex flex-col items-start gap-5 p-5 overflow-hidden box-border relative">
            <div className="flex flex-col gap-0 p-1 w-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div
                    onClick={copyGameIdToClipboard}
                    className="bg-gradient-to-br from-[#6a11cb] to-[#2575fc] text-white rounded-xl p-5 shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-xl"
                >
                    <p className="text-lg md:text-xl font-bold m-0">
                        <strong>Game ID:</strong> {gameId}
                    </p>
                    <p className="text-base m-0">
                        <strong>Host:</strong>{" "}
                        <span className={`font-bold ${isHost ? "text-yellow-300" : "text-white"}`}>
              {isHost ? "You" : host || "Unknown"}
            </span>
                    </p>
                </div>

                <div className="relative">
                    {copySuccess && (
                        <div className="absolute mt-2 px-3.5 py-2.5 left-3 bg-green-500 rounded-md text-white text-sm text-center shadow-md">
                            Game ID copied to clipboard!
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl mt-3 font-extrabold bg-gradient-to-r from-[#1e88e5] via-[#3d5afe] to-[#5c6bc0] text-white px-5 py-5 rounded-lg text-center flex items-center gap-2.5 shadow-md mb-3">
                        Players
                    </h2>
                    <ul className="list-none p-0 m-0">
                        {players.map((player, index) => (
                            <li
                                key={index}
                                className={`flex items-center p-2.5 rounded-lg mb-2 text-base shadow-sm ${
                                    host === player.name ? "bg-yellow-200 text-blue-500" : "bg-gray-100 text-blue-500"
                                }`}
                            >
                                <Avatar name={player.name} size="8" color={player.color} textColor={player.text_color} />
                                <div className="flex flex-col flex-1 ml-3">
                  <span className={host === player.name ? "font-bold" : ""}>
                    {player.name}
                  </span>
                                    {host === player.name && players.length > 1 ? (
                                        <span className="text-yellow-500 -mt-2 text-sm">Host</span>
                                    ) : (
                                        <span
                                            className={`-mt-1.5 font-bold text-sm ${
                                                scores[player.name] < 0 ? "text-red-500" : "text-green-500"
                                            }`}
                                        >
                      ${scores[player.name] || 0}
                    </span>
                                    )}
                                </div>
                                {isHost && (
                                    <div className="flex gap-2 ml-auto">
                                        <button
                                            onClick={() => handleScoreUpdate(player.name, -lastQuestionValue)}
                                            className="w-8 h-8 p-0 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                                        >
                                            −
                                        </button>
                                        <button
                                            onClick={() => handleScoreUpdate(player.name, lastQuestionValue)}
                                            className="w-8 h-8 p-0 bg-green-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-green-600"
                                        >
                                            ＋
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Fixed Bottom Section */}
            <div className="fixed bottom-0 left-0 w-full md:w-72 flex flex-col items-center gap-5 z-[100]">
                {isHost && selectedClue && players.length > 0 && !(players.length === 1 && isHost) && !isFinalJeopardy && (
                    <button
                        onClick={() => {
                            if (buzzerLocked) {
                                if (socket && isSocketReady) {
                                    socket.send(JSON.stringify({ type: "unlock-buzzer", gameId }));
                                }
                                setBuzzerLocked(false);
                            } else {
                                if (socket && isSocketReady) {
                                    socket.send(JSON.stringify({ type: "reset-buzzer", gameId }));
                                }
                                setIsBuzzed(false);
                                setBuzzResult(null);
                                setBuzzerLocked(true);
                            }
                        }}
                        className={`px-12 py-7 text-white text-2xl font-bold border-none cursor-pointer min-w-72 ${
                            buzzerLocked ? "bg-green-500" : isBuzzed ? "bg-red-500" : "bg-gray-500"
                        } ${!isBuzzed && !buzzerLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={!isBuzzed && !buzzerLocked}
                    >
                        {buzzerLocked ? "Unlock Buzzer" : "Reset Buzzer"}
                    </button>
                )}

                {profile && profile.role === 'admin' && isHost && activeBoard !== "finalJeopardy" && (
                    <button
                        onClick={markAllCluesComplete}
                        className="px-10 py-5 bg-red-700 text-white text-xl font-bold border-none rounded-lg cursor-pointer min-w-72 hover:bg-red-800"
                    >
                        Mark All Questions Complete
                    </button>
                )}

                {!isHost && selectedClue && !isFinalJeopardy && (
                    <button
                        onClick={handleBuzz}
                        disabled={isBuzzed || buzzLockedOut}
                        className={`px-16 py-10 text-white text-3xl font-bold border-none cursor-pointer min-w-[300px] ${
                            buzzLockedOut
                                ? "bg-orange-500"
                                : isBuzzed || buzzerLocked
                                    ? "bg-gray-500 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                        }`}
                    >
                        {buzzLockedOut ? "Locked Out" : buzzerLocked ? "Buzz Early" : "Buzz!"}
                    </button>
                )}
            </div>

            {buzzResult && (
                <div className="flex items-center justify-start p-2.5 mb-2.5 bg-gradient-to-br from-[#6dd5fa] to-[#2980b9] text-white rounded-lg font-bold text-lg shadow-md">
                    <span className="mr-2.5 text-xl">🎉</span>
                    <span>{buzzResult}</span>
                </div>
            )}
        </div>
    );
};

export default Sidebar;