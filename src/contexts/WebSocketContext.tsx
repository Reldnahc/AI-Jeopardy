import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import {useProfile} from "./ProfileContext.tsx";
import {useAuth} from "./AuthContext.tsx";

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
    const [hasSentJoinMessage, setHasSentJoinMessage] = useState(false);
    const { profile, error} = useProfile();
    const { loading } = useAuth();

    useEffect(() => {
        if (!socketRef.current ) {
            // Initialize WebSocket connection
            //socketRef.current = new WebSocket("wss://reldnahc.duckdns.org");
            socketRef.current = new WebSocket("ws://localhost:3001");

            // Handle successful connection

            socketRef.current.onopen = () => {
                console.log("WebSocket connected");
                setIsSocketReady(true); // Mark socket as ready

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

    const sendJoinMessage = () => {

        if (socketRef.current && isSocketReady) {

            const currentPage = location.hash;
            const playerName = profile?.displayname; // Use profile when available
            const gameId = currentPage.split('/')[2];
            const action = currentPage.includes('/lobby')
                ? 'join-lobby'
                : currentPage.includes('/game')
                    ? 'join-game'
                    : null;

            if (action) {
                socketRef.current?.send(
                    JSON.stringify({
                        type: action,
                        gameId,
                        playerName,
                    })
                );
                console.log(`Sent ${action} message with playerName: ${playerName}`);
            }
        }
    };

    // Retry sending the join message when profile or loading state changes
    useEffect(() => {
        console.log("profile");
        console.log(profile);
        if (profile && isSocketReady && !hasSentJoinMessage) {
            console.log("Sending join message...");
            sendJoinMessage(); // Trigger join message when profile becomes available
            setHasSentJoinMessage(true);
        }
    }, [profile, error, isSocketReady, hasSentJoinMessage, loading]);

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