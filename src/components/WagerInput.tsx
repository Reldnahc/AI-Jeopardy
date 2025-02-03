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
            {isHost && players.length > 1 ? (
                <p>Waiting for players to place their wagers...</p>
            ) : (
                players
                    .filter((player) => player === currentPlayer) // Only show box for the current player
                    .map((player) => {
                        return (
                            <div
                                key={player}
                                className="flex flex-row items-center mb-2"
                            >
                                <span className="mr-2">{player}:</span>
                                {scores[player] <= 0 ? (
                                    <span className="text-red-500">
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
                                            className="w-[100px] p-1 mr-2 border border-gray-300 rounded"
                                        />
                                        {!wagerSubmitted.includes(player) ? (
                                            <button
                                                onClick={() => submitWager(player)}
                                                className="px-3 py-1 bg-green-600 text-white rounded cursor-pointer"
                                            >
                                                Submit Wager
                                            </button>
                                        ) : (
                                            <span className="text-lime-500">
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