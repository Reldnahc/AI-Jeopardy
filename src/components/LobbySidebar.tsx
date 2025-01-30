import React from "react";

interface LobbySidebarProps {
    gameId: string | undefined;
    isHost: boolean;
    host: string | null;
    players: string[];
    copySuccess: boolean;
    setCopySuccess: React.Dispatch<React.SetStateAction<boolean>>;
}

const LobbySidebar: React.FC<LobbySidebarProps> = ({
                                                gameId,
                                                isHost,
                                                host,
                                                players,
                                                  copySuccess,
                                                setCopySuccess
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
                flex: "0 0 15%",
                minWidth: "200px",
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
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

    );
};

export default LobbySidebar;