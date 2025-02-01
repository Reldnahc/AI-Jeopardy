import React, { createContext, useContext, useRef, useEffect, useState } from "react";

interface WebSocketContextType {
    socket: WebSocket | null;
    isSocketReady: boolean;
}

// Create a context for the WebSocket
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// WebSocketProvider Component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isSocketReady, setIsSocketReady] = useState(false);

    useEffect(() => {
        if (!socketRef.current) {
            // Initialize WebSocket connection
            //socketRef.current = new WebSocket("wss://reldnahc.duckdns.org");
            socketRef.current = new WebSocket("ws://localhost:3001");

            // Handle successful connection
            socketRef.current.onopen = () => {
                console.log("WebSocket connected");
                setIsSocketReady(true); // Set ready state to true
                const currentPage = location.hash;
                console.log("Current page:", currentPage);

                const gameId = localStorage.getItem("gameId"); // Persist game ID in localStorage
                const playerName = localStorage.getItem("playerName"); // Persist player name in localStorage

                const action = currentPage.includes('/lobby') ? 'join-lobby' :
                    currentPage.includes('/game') ? 'join-game' : null;
                if (action){
                    socketRef.current?.send(JSON.stringify({
                        type: action,
                        gameId,
                        playerName,
                    }));
                }
            };
            
            // Handle socket errors
            socketRef.current.onerror = (error) => {
                console.error("WebSocket error:", error);
                setIsSocketReady(false); // Ensure it's marked as not ready
            };

            // Handle socket closure
            socketRef.current.onclose = () => {
                console.log("WebSocket closed, cleaning up...");
                socketRef.current = null; // Reset reference
                setIsSocketReady(false); // Set ready state to false
            };

            console.log("WebSocket initialized:", socketRef.current);
        }

    }, []);

    return (
        <WebSocketContext.Provider value={{ socket: socketRef.current, isSocketReady }}>
            {children}
        </WebSocketContext.Provider>
    );
};

// Custom Hook to use the WebSocket context
export const useWebSocket = () => {
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }

    return context;
};