import { WebSocketServer } from 'ws';
import 'dotenv/config';
import { createBoardData, createCategoryOfTheDay } from './services/aiService.js';
import express from "express"; // Import express
import cors from "cors"; // Import cors
import bodyParser from "body-parser"; // Import body-parser
import {PING_INTERVAL, WS_PORT} from "./config/websocket.js";
import {supabase} from "./config/database.js";
import {getColorFromPlayerName} from "./services/userService.js";

const app = express(); // Initialize Express app
app.use(cors());
app.use(bodyParser.json());
const wss = new WebSocketServer({ port: WS_PORT, });
console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);

const authenticateRequest = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data) {
        return res.status(401).send("Unauthorized");
    }

    req.user = data; // Attach the user to the request object
    next();
};

// Example of a protected route
app.get("/protected", authenticateRequest, (req, res) => {
    res.send(`Hello, ${req.user.email}. This is a protected API!`);
});

app.listen(3002, () => console.log("Server running on http://localhost:3002"));

// Store game state
const games = {};

let cotd =
    {
    category: "",
    description: ""
    };

wss.on('connection', (ws) => {
    ws.id = Math.random().toString(36).substr(2, 9); // Assign a unique ID to each socket
    console.log('New client connected');
    ws.isAlive = true; // Mark connection as alive when established

    ws.on('pong', () => {
        ws.isAlive = true; // Mark as healthy when a pong is received
    });

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        console.log(`[Server] Received message from client ${ws.id}:`, data);
        if (data.type === 'create-game' || data.type === 'join-game' ||
            data.type === 'create-lobby' || data.type === 'join-lobby' ||
            data.type === 'check-lobby') {
            // Assign the game ID to the WebSocket instance
            ws.gameId = data.gameId;
        }
        if (data.type === 'request-lobby-state'){
            ws.send(JSON.stringify({
                type: 'lobby-state',
                gameId: data.gameId,
                players: games[data.gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    text_color: p.text_color,
                })),
                host: games[data.gameId].host,
                categories: games[data.gameId].categories || [],
            }));
        }
        if (data.type === 'create-lobby') {
            const { host, categories} = data;
            let newGameId;
            do {
                newGameId = Math.random().toString(36).substr(2, 5).toUpperCase();
            } while (games[newGameId]);

            if (games[newGameId]) {
                //throw error? this shouldnt happen

            } else {
                const color = await getColorFromPlayerName(host);
                // Create a new game
                console.log(`Creating new game ${newGameId} with host ${host} with color ${color.color} and categories ${categories}`);
                games[newGameId] = {
                    host: host,
                    players: [{id: ws.id, name: host, color: color.color, text_color: color.text_color}],
                    inLobby: true,
                    categories: categories || [],
                    lockedCategories: {
                        firstBoard: Array(5).fill(false),
                        secondBoard: Array(5).fill(false),
                        finalJeopardy: Array(1).fill(false),
                    }
                };
                ws.send(JSON.stringify({
                    type: 'lobby-created',
                    gameId: newGameId,
                    categories: categories || [],
                    players: [{id: ws.id, name: host, color: color.color, text_color: color.text_color}],
                }));
            }
        }

        if (data.type === 'join-lobby') {
            const {gameId, playerName} = data;

            // Reject blank player names
            if (!games[gameId]) {
                ws.send(JSON.stringify({type: 'error', message: 'Lobby does not exist!'}));
                return;
            }

            const existingPlayer = games[gameId].players.find((p) => p.id === ws.id || p.name === playerName);
            // Reject if the player already exists
            if (existingPlayer) {
                ws.send(JSON.stringify({type: 'info', message: 'You are already in the lobby.'}));
                return;
            }

            let actualName = playerName;

            // Assign "Guest" if name is blank or whitespace
            if (!playerName || !playerName.trim()) {
                let guestIndex = 1;
                const usedNames = games[gameId].players.map((player) => player.name);

                // Increment guest index until an unused guest name is found
                while (usedNames.includes(`Guest ${guestIndex}`)) {
                    guestIndex++;
                }
                actualName = `Guest ${guestIndex}`;
            }

            // Add the player to the game
            const msg = await getColorFromPlayerName(actualName);
            let color;
            let text_color;

            if (msg && msg.color) color = msg.color;
            else color = "bg-blue-500";
            if (msg && msg.text_color) text_color = msg.text_color;
            else text_color = "text-white";

            // Add the player
            games[gameId].players.push({ id: ws.id, name: actualName, color: color,text_color: text_color });
            console.log(`Player ${actualName} joined game ${gameId}`);

            ws.send(JSON.stringify({
                type: 'lobby-state',
                gameId,
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    text_color: p.text_color,
                })),
                host: games[gameId].host,
                categories: games[gameId].categories || [],
                lockedCategories: games[gameId].lockedCategories
            }));
            broadcast(gameId, {
                type: 'player-list-update',
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    text_color: p.text_color,
                })),
                host: games[gameId].host,
            });
        }

        if (data.type === 'create-game') {
            const {gameId, categories, selectedModel, host, temperature, timeToBuzz, timeToAnswer} = data;

            broadcast(gameId, {
                type: 'trigger-loading',
            });

            const boardData = await createBoardData(categories, selectedModel, host, temperature);

            console.log(boardData);

            if (!games[gameId] || !boardData) {
                console.log("error starting game: " + gameId + " board data failed to create");
                broadcast(gameId, {
                    type: 'create-board-failed',
                });
            } else if (games[gameId].inLobby) {
                games[gameId].buzzed = null;
                games[gameId].buzzerLocked = true;
                games[gameId].clearedClues = new Set();
                games[gameId].boardData = boardData;
                games[gameId].scores = {};
                games[gameId].inLobby = false;
                games[gameId].timeToBuzz = timeToBuzz;
                games[gameId].timeToAnswer = timeToAnswer;
                //todo suspect I subtract tokens here
                console.log(games[gameId].players);
                broadcast(gameId, {
                    type: 'start-game',
                    host: host,

                });
            }else{
                console.log("error moving from lobby to game. game already in progress.");
            }

        }

        if (data.type === 'check-lobby') {
            console.log("checking lobby: " + data.gameId);
            const {gameId} = data;
            let isValid = false;
            if (games[gameId] && games[gameId].inLobby === true) {
                isValid = true;
            }

            ws.send(JSON.stringify({ type: 'check-lobby-response', isValid, gameId }));
        }

        if (data.type === 'check-cotd') {
            ws.send(JSON.stringify({ type: 'category-of-the-day', cotd }));
        }

        if (data.type === 'toggle-lock-category') {
            const { gameId, boardType, index, locked } = data;

            if (games[gameId]) {

                // Update the specific lock state for the given boardType and index
                games[gameId].lockedCategories[boardType][index] = locked;

                // Notify all players in the game about the updated lock state
                broadcast(gameId, {
                    type: 'category-lock-updated',
                    boardType,
                    index,
                    locked,
                });
            } else {
                console.error(`[Server] Game ID ${gameId} not found when toggling lock for a category.`);
            }
        }

        if (data.type === 'update-categories') {
            const { gameId, categories } = data;

            if (games[gameId]) {
                // Broadcast the updated categories to all players in the lobby
                broadcast(gameId, {
                    type: 'categories-updated',
                    categories,
                });
                console.log(`[Server] Categories updated for game ${gameId}:`, categories);
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Only the host can update categories.' }));
            }
        }

        if (data.type === 'buzz') {
            const { gameId } = data;

            games[gameId].timerVersion = (games[gameId].timerVersion || 0) + 1;
            const currentVersion = games[gameId].timerVersion;


            if (games[gameId] && !games[gameId].buzzed) {
                const player = games[gameId].players.find(player => player.id === ws.id);
                if (player && player.name){
                    games[gameId].buzzed = player.name;
                    // Notify all players who buzzed first
                    broadcast(gameId, {
                        type: 'buzz-result',
                        playerName: player.name,
                    });
                }
            }


            // Only start timer if timeToBuzz is not -1 (infinite time)
            if (games[gameId].timeToAnswer !== -1) {
                // Store the end time (current time + duration)
                const endTime = Date.now() + (games[gameId].timeToAnswer * 1000);
                games[gameId].timerEndTime = endTime;

                // Broadcast initial timer state to all players
                broadcast(gameId, {
                    type: 'timer-start',
                    endTime: endTime,
                    duration: games[gameId].timeToAnswer,
                    timerVersion: currentVersion
                });

                setTimeout(() => {
                    // Only lock the buzzer if it hasn't been locked already
                    if (games[gameId] && games[gameId].timerVersion === currentVersion
                        && games[gameId].buzzed) {
                        games[gameId].timerEndTime = null; // Clear the timer end time
                        broadcast(gameId, {type: 'timer-end'});
                    }
                }, games[gameId].timeToBuzz * 1000);
            }
        }

        if (data.type === 'reset-buzzer') {
            const {gameId} = data;

            if (games[gameId]) {
                games[gameId].buzzed = null;
                games[gameId].buzzerLocked = true;

                games[gameId].timerVersion = (games[gameId].timerVersion || 0) + 1;

                // Notify all players to reset the buzzer
                broadcast(gameId, {type: 'reset-buzzer'});
            }
        }

        if (data.type === 'mark-all-complete') {
            const {gameId} = data;

            if (games[gameId]) {
                const game = games[gameId];

                // Determine all clues based on boardData
                if (game.boardData) {
                    const {firstBoard, finalJeopardy} = game.boardData;
                    const clearCluesFromBoard = (board) => {
                        board.forEach(category => {
                            category.values.forEach(clue => {
                                const clueId = `${clue.value}-${clue.question}`;
                                game.clearedClues.add(clueId); // Add all clues to "clearedClues" set
                            });
                        });
                    };

                    // Clear clues for the two main boards
                    if (firstBoard) clearCluesFromBoard(firstBoard.categories);
                    //if (secondBoard) clearCluesFromBoard(secondBoard.categories);

                    // Handle Final Jeopardy clue
                    if (finalJeopardy && finalJeopardy.categories.values && finalJeopardy.categories.values[0]) {
                        const finalClueId = `${finalJeopardy.categories.values[0].question}`;
                        game.clearedClues.add(finalClueId);
                    }

                    // Broadcast the updated cleared clues to all clients
                    broadcast(gameId, {
                        type: 'all-clues-cleared',
                        clearedClues: Array.from(game.clearedClues), // Send the cleared clues as an array
                    });
                }
            } else {
                console.error(`[Server] Game ID ${gameId} not found when marking all clues complete.`);
            }
        }
        if (data.type === 'trigger-game-over') {
            const {gameId} = data;

            broadcast(gameId, {
                type: 'game-over',
            });
        }
        if (data.type === 'clue-selected') {
            const {gameId, clue} = data;

            if (games[gameId]) {
                games[gameId].selectedClue = {
                    ...clue,
                    isAnswerRevealed: false, // Add if the answer is revealed or not
                };

                // Reset buzzer state
                games[gameId].buzzed = null;
                games[gameId].buzzerLocked = true;

                // Broadcast the selected clue to all players in the game
                broadcast(gameId, {
                    type: 'clue-selected',
                    clue: games[gameId].selectedClue, // Send the clue and answer reveal status
                    clearedClues: Array.from(games[gameId].clearedClues),
                });

                broadcast(gameId, {type: 'reset-buzzer'});
                broadcast(gameId, {type: 'buzzer-locked'});
            } else {
                console.error(`[Server] Game ID ${gameId} not found when selecting clue.`);
            }
        }

        if (data.type === 'join-game') {
            const { gameId, playerName } = data;
            if (!playerName || !playerName.trim()) {
                ws.send(JSON.stringify({ type: 'error', message: 'Player name cannot be blank.' }));
                return;
            }

            if (!games[gameId]) {
                ws.send(JSON.stringify({ type: 'error', message: 'Game does not exist!' }));
                return;
            }

            // Check if the player is already in the game based on socket ID
            const existingPlayer = games[gameId].players.find((p) => p.id === ws.id);
            if (existingPlayer) {
                ws.send(JSON.stringify({ type: 'info', message: 'You are already in the game.' }));
            } else {
                if (!games[gameId].players.includes(playerName)) {
                    const color = await getColorFromPlayerName(playerName);
                    games[gameId].players.push({id: ws.id, name: playerName, color: color.color, text_color: color.text_color});
                }
            }

            // Notify the new player of the current game state (buzz result, buzzer status, board, and selected clue if any)
            ws.send(JSON.stringify({
                type: 'game-state',
                gameId,
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    text_color: p.text_color,
                })),
                host: games[gameId].host,
                buzzResult: games[gameId].buzzed,
                clearedClues: Array.from(games[gameId].clearedClues || new Set()),
                boardData: games[gameId].boardData,
                selectedClue: games[gameId].selectedClue || null, // Add currently selected clue if any
                buzzerLocked: games[gameId].buzzerLocked,         // Send buzzer state
                scores: games[gameId].scores,
            }));

            // Notify all players
            broadcast(gameId, {
                type: 'player-list-update',
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    text_color: p.text_color,
                })),
                host: games[gameId].host,
            });
        }

        if (data.type === 'request-player-list') {
            const { gameId } = data;
            ws.send(JSON.stringify({
                type: 'player-list-update',
                gameId,
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    text_color: p.text_color,
                })),
                host: games[gameId].host,
            }));
        }

        if (data.type === 'leave-game') {
            const { gameId } = data;

            console.log("game", games[gameId]);

            if (games[gameId]) {

                // Remove the player from the list of players in the game
                games[gameId].players = games[gameId].players.filter((player) => {
                    if (player.id === ws.id) {
                        console.log(`Player ${player.name} is being removed from game ${gameId}`);
                        return false; // Exclude this player from the filtered list
                    }
                    return true; // Include all other players
                });

                // Optional: Notify other players in the game that this player has left
                broadcast(gameId, {
                    type: 'player-list-update',
                    players: games[gameId].players.map((p) => ({
                        name: p.name,
                        color: p.color,
                        text_color: p.text_color,
                    })),
                    host: games[gameId].host,
                });
            }
        }


        if (data.type === 'reveal-answer') {
            const {gameId} = data;

            if (games[gameId] && games[gameId].selectedClue) {
                // Update the clue's state to mark the answer as revealed
                games[gameId].selectedClue.isAnswerRevealed = true;

                // Notify all players to display the answer
                broadcast(gameId, {
                    type: 'answer-revealed',
                });
            } else {
                console.error(`[Server] Game ID ${gameId} not found or no clue selected when revealing answer.`);
            }
        }

        if (data.type === 'return-to-board') {
            const {gameId} = data;

            if (games[gameId]) {
                games[gameId].selectedClue = null; // Clear the selected clue
                // Notify all clients to return to the board
                broadcast(gameId, {
                    type: 'returned-to-board',
                });
            } else {
                console.error(`[Server] Game ID ${gameId} not found when returning to board.`);
            }
        }

        if (data.type === 'clue-cleared') {
            const {gameId, clueId} = data;

            if (games[gameId]) {
                // Add the cleared clue to the game's cleared clues set
                if (!games[gameId].clearedClues) {
                    games[gameId].clearedClues = new Set();
                }
                games[gameId].clearedClues.add(clueId);

                // Broadcast to all players that this clue has been cleared
                broadcast(gameId, {
                    type: 'clue-cleared',
                    clueId,
                });
            } else {
                console.error(`[Server] Game ID ${gameId} not found when clearing clue.`);
            }
        }

        if (data.type === 'unlock-buzzer') {
            const {gameId} = data;

            if (games[gameId]) {
                games[gameId].buzzerLocked = false; // Unlock the buzzer

                games[gameId].timerVersion = (games[gameId].timerVersion || 0) + 1;
                const currentVersion = games[gameId].timerVersion;

                broadcast(gameId, {type: 'buzzer-unlocked'}); // Notify all players

                // Only start timer if timeToBuzz is not -1 (infinite time)
                if (games[gameId].timeToBuzz !== -1) {
                    // Store the end time (current time + duration)
                    const endTime = Date.now() + (games[gameId].timeToBuzz * 1000);
                    games[gameId].timerEndTime = endTime;

                    // Broadcast initial timer state to all players
                    broadcast(gameId, {
                        type: 'timer-start',
                        endTime: endTime,
                        duration: games[gameId].timeToBuzz,
                        timerVersion: currentVersion
                    });

                    setTimeout(() => {
                        // Only lock the buzzer if it hasn't been locked already
                        if (games[gameId] && !games[gameId].buzzerLocked &&
                            games[gameId].timerVersion === currentVersion
                            && !games[gameId].buzzed) {
                            games[gameId].buzzerLocked = true;
                            games[gameId].timerEndTime = null; // Clear the timer end time
                            broadcast(gameId, {type: 'buzzer-locked'});
                            broadcast(gameId, {type: 'timer-end'});
                            broadcast(gameId, {type: 'answer-revealed'});
                        }
                    }, games[gameId].timeToBuzz * 1000);
                }
            }
        }

        if (data.type === 'lock-buzzer') {
            const {gameId} = data;

            if (games[gameId]) {
                games[gameId].buzzerLocked = true; // Lock the buzzer
                broadcast(gameId, {type: 'buzzer-locked'}); // Notify all players
            }
        }

        if (data.type === 'transition-to-second-board') {
            const {gameId} = data;

            if (games[gameId]) {
                broadcast(gameId, {type: 'transition-to-second-board'});
            } else {
                console.error(`[Server] Game ID ${gameId} not found for board transition.`);
            }
        }

        if (data.type === 'update-score') {
            const {gameId, player, delta} = data;

            if (games[gameId]) {
                // Update score
                const game = games[gameId];
                game.scores[player] = (game.scores[player] || 0) + delta;
                console.log(game.scores);
                // Broadcast updated scores
                broadcast(gameId, {
                    type: 'update-scores',
                    scores: game.scores,
                });
            }
        }

        if (data.type === "submit-wager") {
            const {gameId, player, wager} = data;

            if (games[gameId]) {
                if (!games[gameId].wagers) {
                    games[gameId].wagers = {};
                }
                games[gameId].wagers[player] = wager;

                broadcast(gameId, {
                    type: "wager-update",
                    player,
                    wager,
                });

                // Check if all wagers are submitted
                let expectedWagers;
                if (games[gameId].players.length === 1){
                    expectedWagers = games[gameId].players.length;
                } else {
                    expectedWagers = games[gameId].players.length - 1;
                }

                const allSubmitted = Object.keys(games[gameId].wagers).length === expectedWagers;

                if (allSubmitted) {
                    broadcast(gameId, {type: "all-wagers-submitted", wagers: games[gameId].wagers});
                }
            }
        }

        if (data.type === 'transition-to-final-jeopardy') {
            const {gameId} = data;

            if (games[gameId]) {
                broadcast(gameId, {type: 'final-jeopardy'});
            } else {
                console.error(`[Server] Game ID ${gameId} not found for board transition.`);
            }
        }

        if (data.type === 'final-jeopardy-drawing') {
            const {gameId, player, drawing} = data;

            if (games[gameId]) {
                // Initialize the drawings object if not present
                if (!games[gameId].drawings) {
                    games[gameId].drawings = {};
                }

                // Parse the drawing if it’s a string
                let parsedDrawing;
                try {
                    parsedDrawing = typeof drawing === 'string' ? JSON.parse(drawing) : drawing;
                } catch (error) {
                    console.error(`[Server] Failed to parse drawing for player ${player}:`, error.message);
                    return; // Exit early if the drawing can't be parsed
                }

                // Store the player's drawing as an object
                games[gameId].drawings[player] = parsedDrawing;

                // Broadcast that the player's drawing is submitted
                broadcast(gameId, {
                    type: 'final-jeopardy-drawing-submitted',
                    player,
                });

                const expectedSubmissions = games[gameId].players.length === 1 ? games[gameId].players.length : games[gameId].players.length - 1;
                const allPlayersSubmitted = Object.keys(games[gameId].drawings).length === expectedSubmissions;

                if (allPlayersSubmitted) {
                    broadcast(gameId, {
                        type: 'all-final-jeopardy-drawings-submitted',
                        drawings: games[gameId].drawings,
                    });
                }
            } else {
                console.error(`[Server] Game ID ${gameId} not found when submitting final jeopardy drawing.`);
            }
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket closed for game ${ws.gameId}`);
        // Remove the player when they disconnect
        Object.keys(games).forEach((gameId) => {
            games[gameId].players = games[gameId].players.filter((p) => p.id !== ws.id);
            broadcast(gameId, {
                type: 'player-list-update',
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                    text_color: p.text_color,
                })),
                host: games[gameId].host,
            });
        });
    });
});

// Broadcast a message to all clients in a specific game
function broadcast(gameId, message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.gameId === gameId) { // Match client by gameId
            client.send(JSON.stringify({ ...message }));
        }
    });
}

setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`Terminating dead connection for client ${ws.id}`);
            return ws.terminate(); // Terminate the connection if unresponsive
        }

        // Mark as inactive until the client responds with a pong
        ws.isAlive = false;
        ws.ping(); // Send a ping for the client to respond with pong
    });
}, PING_INTERVAL);

cotd = await createCategoryOfTheDay();
setInterval(async () => {
    cotd = await createCategoryOfTheDay();
}, 60000 * 60);



