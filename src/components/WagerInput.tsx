import React from "react";

interface WagerInputProps {
    players: string[];
    currentPlayer: string;
    isHost: boolean;
    scores: Record<string, number>;
    wagers: Record<string, number>;
    wagerSubmitted: string[];
    handleWagerChange: (player: string, wager: number) => void;
    submitWager: (player: string) => void;
}

const WagerInput: React.FC<WagerInputProps> = ({
                                                   players,
                                                   currentPlayer,
                                                   isHost,
                                                   scores,
                                                   wagers,
                                                   wagerSubmitted,
                                                   handleWagerChange,
                                                   submitWager,
                                               }) => {
    return (
        <div>
            {isHost ? (
                players.length === 0 ? (
                    // Host sees wagers only if no players are present
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: "10px",
                        }}
                    >
                        <span style={{ marginRight: "10px" }}>Host:</span>
                        <input
                            type="number"
                            min={0}
                            max={scores["host"] || 0}
                            value={wagers["host"] || ""}
                            onChange={(e) =>
                                handleWagerChange("host", parseInt(e.target.value, 10))
                            }
                            disabled={wagerSubmitted.includes("host")}
                            style={{
                                width: "100px",
                                padding: "5px",
                                marginRight: "10px",
                            }}
                        />
                        {!wagerSubmitted.includes("host") ? (
                            <button
                                onClick={() => submitWager("host")}
                                style={{
                                    padding: "6px 12px",
                                    background: "green",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                Submit Wager
                            </button>
                        ) : (
                            <span style={{ color: "lime" }}>Wager Submitted!</span>
                        )}
                    </div>
                ) : (
                    <p>Waiting for players to place their wagers...</p>
                )
            ) : (
                players
                    .filter((player) => player === currentPlayer) // Only show box for the current player
                    .map((player) => {
                        return (
                            <div
                                key={player}
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: "10px",
                                }}
                            >
                                <span style={{ marginRight: "10px" }}>{player}:</span>
                                {scores[player] <= 0 ? (
                                    <span style={{ color: "red" }}>
                                        Wager Automatically Set to $0
                                    </span>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            min={0}
                                            max={scores[player] || 0}
                                            value={wagers[player] || ""}
                                            onChange={(e) =>
                                                handleWagerChange(
                                                    player,
                                                    parseInt(e.target.value, 10)
                                                )
                                            }
                                            disabled={wagerSubmitted.includes(player)}
                                            style={{
                                                width: "100px",
                                                padding: "5px",
                                                marginRight: "10px",
                                            }}
                                        />
                                        {!wagerSubmitted.includes(player) ? (
                                            <button
                                                onClick={() => submitWager(player)}
                                                style={{
                                                    padding: "6px 12px",
                                                    background: "green",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Submit Wager
                                            </button>
                                        ) : (
                                            <span style={{ color: "lime" }}>
                                                Wager Submitted!
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })
            )}
        </div>
    );
};

export default WagerInput;