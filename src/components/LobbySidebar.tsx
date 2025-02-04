import React from "react";
import Avatar from "./common/Avatar.tsx";
import {Player} from "../types/Lobby.ts";

interface LobbySidebarProps {
    gameId: string | undefined;
    isHost: boolean;
    host: string | null;
    players: Player[];
    copySuccess: boolean;
    setCopySuccess: React.Dispatch<React.SetStateAction<boolean>>;
}

const LobbySidebar: React.FC<LobbySidebarProps> = ({
                                                       gameId,
                                                       isHost,
                                                       host,
                                                       players,
                                                       copySuccess,
                                                       setCopySuccess,
                                                   }) => {
    const copyGameIdToClipboard = () => {
        if (gameId) {
            navigator.clipboard.writeText(gameId); // Copy Game ID to clipboard
            setCopySuccess(true); // Show toast
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <div className="flex-none w-[300px] flex flex-col items-start gap-5 p-5 overflow-hidden box-border relative">
            <div className="flex flex-col gap-0 p-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {/* Game ID and Host Card */}
                <div
                    onClick={copyGameIdToClipboard}
                    className="bg-gradient-to-br from-[#6a11cb] to-[#2575fc] text-white rounded-xl p-5 shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-xl"
                >
                    <p className="text-lg font-bold m-0">
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

                {/* Player List Section */}
                <div>
                    <h2 className="text-2xl mt-3 font-extrabold bg-gradient-to-r from-[#1e88e5] via-[#3d5afe] to-[#5c6bc0] text-white px-5 py-5 rounded-lg text-center flex items-center gap-2.5 shadow-md mb-3">
                        Players
                    </h2>
                    <ul className="list-none p-0 m-0">
                        {players
                            .filter((player) => !(players.length > 1 && player.name === host)) // Exclude the host if there are multiple players
                            .map((player, index) => (
                                <li
                                    key={index}
                                    className={`flex items-center p-2.5 bg-gray-100 rounded-lg mb-2 text-base shadow-sm text-blue-500`}
                                >
                                    <Avatar name={player.name} size="8" color={player.color}/>

                                    <div className="flex flex-col flex-1 ml-3">
                                        <span className={host === player.name ? "font-bold" : ""}>
                                            {player.name}
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