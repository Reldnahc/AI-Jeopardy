import React from "react";
import { Clue } from "../types";

interface SidebarProps {
    gameId: string | undefined;
    isHost: boolean;
    host: string | null;
    players: string[];
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
    socketRef: React.MutableRefObject<WebSocket | null>;
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
                                             socketRef
                                         }) => {
    const copyGameIdToClipboard = () => {
        if (gameId) {
            navigator.clipboard.writeText(gameId); // Copy Game ID to clipboard
            setCopySuccess(true); // Show toast
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <div
            style={{
                flex: "0 0 300px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "20px",
                padding: "20px",
                overflow: "hidden",
                boxSizing: "border-box",
                position: "relative"
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0px",
                    padding: "5px",
                    fontFamily: "'Poppins', sans-serif"
                }}
            >
                <div
                    onClick={copyGameIdToClipboard}
                    style={{
                        background: "linear-gradient(135deg, #6a11cb, #2575fc)",
                        color: "white",
                        borderRadius: "10px",
                        padding: "20px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        cursor: "pointer"
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                    }}
                >
                    <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0" }}>
                        <strong>Game ID:</strong> {gameId}
                    </p>
                    <p style={{ fontSize: "16px", margin: "0" }}>
                        <strong>Host:</strong>{" "}
                        <span
                            style={{
                                fontWeight: "bold",
                                color: isHost ? "#ffeb3b" : "#ffffff"
                            }}
                        >
              {isHost ? "You" : host || "Unknown"}
            </span>
                    </p>
                </div>
                {copySuccess && (
                    <div
                        style={{
                            marginTop: "10px",
                            padding: "10px 15px",
                            backgroundColor: "#4caf50",
                            borderRadius: "5px",
                            color: "white",
                            fontSize: "14px",
                            textAlign: "center",
                            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)"
                        }}
                    >
                        Game ID copied to clipboard!
                    </div>
                )}
                {/* Player List Section */}
                <div>
                    <h2
                        style={{
                            fontSize: "24px",
                            fontWeight: "bolder",
                            background: "linear-gradient(to right, #1e88e5, #3d5afe, #5c6bc0)",
                            color: "white",
                            padding: "20px 20px",
                            borderRadius: "8px",
                            textAlign: "center",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}
                    >
                        Players
                    </h2>
                    <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                        {players.map((player, index) => (
                            <li
                                key={index}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "10px",
                                    backgroundColor: host === player ? "#ffe082" : "#f5f5f5",
                                    borderRadius: "8px",
                                    marginBottom: "8px",
                                    fontSize: "16px",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                                }}
                            >
                                <div
                                    style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "50%",
                                        backgroundColor: host === player ? "#ffca28" : "#2196f3",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        color: "white",
                                        fontWeight: "bold",
                                        marginRight: "10px"
                                    }}
                                >
                                    {player.charAt(0).toUpperCase()}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        flex: 1
                                    }}
                                >
                  <span
                      style={{
                          fontWeight: host === player ? "bold" : "normal"
                      }}
                  >
                    {player}
                  </span>
                                    <span
                                        style={{
                                            marginTop: "5px",
                                            fontWeight: "bold",
                                            fontSize: "14px",
                                            color:
                                                scores[player] < 0 ? "#f44336" : "#4caf50"
                                        }}
                                    >
                    ${scores[player] || 0}
                  </span>
                                </div>
                                {isHost && (
                                    <div
                                        style={{ display: "flex", gap: "8px", marginLeft: "auto" }}
                                    >
                                        <button
                                            onClick={() =>
                                                handleScoreUpdate(player, -lastQuestionValue)
                                            }
                                            style={{
                                                padding: "5px 10px",
                                                backgroundColor: "#f44336",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "40%",
                                                fontSize: "14px",
                                                cursor: "pointer"
                                            }}
                                            onMouseOver={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#d32f2f")
                                            }
                                            onMouseOut={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#f44336")
                                            }
                                        >
                                            −
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleScoreUpdate(player, lastQuestionValue)
                                            }
                                            style={{
                                                padding: "5px 10px",
                                                backgroundColor: "#4caf50",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "40%",
                                                fontSize: "14px",
                                                cursor: "pointer"
                                            }}
                                            onMouseOver={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#388e3c")
                                            }
                                            onMouseOut={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#4caf50")
                                            }
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
            <div
                style={{
                    position: "fixed",
                    bottom: "0px",
                    left: "20px",
                    width: "260px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "20px",
                    zIndex: 100
                }}
            >
                {isHost && selectedClue && players.length > 0 && !isFinalJeopardy && (
                    <button
                        onClick={() => {
                            if (buzzerLocked) {
                                socketRef.current?.send(
                                    JSON.stringify({ type: "unlock-buzzer", gameId })
                                );
                                setBuzzerLocked(false);
                            } else {
                                socketRef.current?.send(
                                    JSON.stringify({ type: "reset-buzzer", gameId })
                                );
                                setIsBuzzed(false);
                                setBuzzResult(null);
                                setBuzzerLocked(true);
                            }
                        }}
                        style={{
                            padding: "30px 50px",
                            backgroundColor: buzzerLocked ? "green" : isBuzzed ? "red" : "gray",
                            color: "white",
                            fontSize: "24px",
                            fontWeight: "bold",
                            border: "none",
                            cursor: "pointer",
                            minWidth: "300px"
                        }}
                        disabled={!isBuzzed && !buzzerLocked}
                    >
                        {buzzerLocked ? "Unlock Buzzer" : "Reset Buzzer"}
                    </button>
                )}
                {isHost && activeBoard !== "finalJeopardy" && (
                    <button
                        onClick={markAllCluesComplete}
                        style={{
                            padding: "20px 40px",
                            backgroundColor: "#D32F2F",
                            color: "white",
                            fontSize: "20px",
                            fontWeight: "bold",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            minWidth: "300px"
                        }}
                    >
                        Mark All Questions Complete
                    </button>
                )}
                {!isHost && selectedClue && !isFinalJeopardy && (
                    <button
                        onClick={handleBuzz}
                        disabled={isBuzzed || buzzLockedOut}
                        style={{
                            padding: "40px 60px",
                            backgroundColor: buzzLockedOut
                                ? "orange"
                                : isBuzzed || buzzerLocked
                                    ? "gray"
                                    : "blue",
                            color: "white",
                            fontSize: "30px",
                            fontWeight: "bold",
                            border: "none",
                            cursor: isBuzzed || buzzerLocked || buzzLockedOut
                                ? "not-allowed"
                                : "pointer",
                            minWidth: "300px"
                        }}
                    >
                        {buzzLockedOut
                            ? "Locked Out"
                            : buzzerLocked
                                ? "Buzz Early"
                                : "Buzz!"}
                    </button>
                )}
            </div>
            {buzzResult && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        padding: "10px 20px",
                        marginBottom: "10px",
                        background: "linear-gradient(135deg, #6dd5fa, #2980b9)",
                        color: "#fff",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "18px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)"
                    }}
                >
                    <span style={{ marginRight: "10px", fontSize: "20px" }}>🎉</span>
                    <span>{buzzResult}</span>
                </div>
            )}
        </div>
    );
};

export default Sidebar;