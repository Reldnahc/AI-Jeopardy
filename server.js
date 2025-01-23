import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import OpenAI from "openai";

const openai = new OpenAI();
const app = express();

app.use(cors());
app.use(express.json());

app.post('/generate-board', async (req, res) => {
    const { categories } = req.body; // Accept categories from request payload
    const { difficulty } = "difficult"; // Accept categories from request payload

    if (!categories || categories.length !== 5) {
        return res.status(400).json({ error: 'You must provide exactly 5 categories.' });
    }

    const prompt = `
         Create a Jeopardy board with the following 5 categories: ${categories.join(', ')}.
         Each category should contain 5 questions, each with a value and an answer. Make sure they follow the jeopardy format.
         The Questions should be a ${difficulty} difficulty. The Questions should avoid having the answer in the either clue or in the category title.
         The answers should be in the format of a question, and the questions a statement. The lower value the more mainstream the information should be. 
         If its a high value question it should be more niche or difficult.
         Using true JSON format the response as:
         [
             {
                 "category": "Category Name",
                 "values": [
                     { "value": 100, "question": "Sample Question?", "answer": "Sample Answer" },
                     // Include more values...
                 ]
             },
             // Include more categories...
         ]
         `;

    try {
        console.log("[Server] Attempting to make request to OpenAI API");
        console.log("[Server] prompt: " + prompt);
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: prompt },
            ],
            store: true,
        });
        console.log(response.choices[0].message.content.replace(/```(?:json)?/g, '').trim());
        const boardData = JSON.parse(response.choices[0].message.content.replace(/```(?:json)?/g, '').trim());

        res.status(200).json({ boardData });
    } catch (error) {
        console.error('[Server] Error generating board data:', error.message);
        res.status(500).json({ error: 'Failed to generate board data.' });
    }
});

const HTTP_PORT = 3000; // Port for HTTP requests
app.listen(HTTP_PORT, () => console.log(`HTTP server running on http://localhost:${HTTP_PORT}`));

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// Store game state
const games = {};

wss.on('connection', (ws) => {
    ws.id = Math.random().toString(36).substr(2, 9); // Assign a unique ID to each socket
    console.log('New client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'create-game') {
            const { gameId, playerName, boardData} = data;

            console.log(boardData);
            // If the game already exists, reassign the host
            if (games[gameId]) {
                games[gameId].host = playerName;

                ws.send(JSON.stringify({
                    type: 'game-state',
                    gameId,
                    players: games[gameId].players.map((p) => p.name),
                    host: games[gameId].host,
                    buzzResult: games[gameId].buzzed, // Current buzz result, if any
                    clearedClues: Array.from(games[gameId].clearedClues || new Set()), // Send cleared clues
                    boardData: boardData,
                }));

                broadcast(gameId, {
                    type: 'player-list-update',
                    players: games[gameId].players.map((p) => p.name),
                    host: games[gameId].host,
                });
            } else {
                // Create a new game
                games[gameId] = {
                    host: playerName,
                    players: [],
                    buzzed: null,
                    buzzerLocked: true,
                    clearedClues: new Set(),
                    boardData: boardData,
                };
            }

            // Notify the host
            ws.send(JSON.stringify({
                type: 'game-created',
                gameId,
                host: playerName,
            }));
        }

        if (data.type === 'join-game') {
            const { gameId, playerName } = data;
            // Reject blank player names
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
                    return;
            }

            // Add the player to the game if not the host
            if (games[gameId].host !== playerName && !games[gameId].players.includes(playerName)) {
                games[gameId].players.push({ id: ws.id, name: playerName });
            }

            // Log the updated player list for debugging
            console.log(`Players in game ${gameId}:`, games[gameId].players);
            // Notify the new player of the current game state (buzz result and buzzer status)
            ws.send(JSON.stringify({
                type: 'game-state',
                gameId,
                players: games[gameId].players.map((p) => p.name),
                host: games[gameId].host,
                buzzResult: games[gameId].buzzed,
                clearedClues: Array.from(games[gameId].clearedClues || new Set()),
                boardData: games[gameId].boardData,
            }));

            // Notify all players
            broadcast(gameId, {
                type: 'player-list-update',
                players: games[gameId].players.map((p) => p.name),
                host: games[gameId].host,
            });
        }

        if (data.type === 'buzz') {
            const { gameId, playerName } = data;

            if (games[gameId] && !games[gameId].buzzed) {
                games[gameId].buzzed = playerName;

                // Notify all players who buzzed first
                broadcast(gameId, {
                    type: 'buzz-result',
                    playerName,
                });
            }
        }

        if (data.type === 'reset-buzzer') {
            const { gameId } = data;

            if (games[gameId]) {
                games[gameId].buzzed = null;

                // Notify all players to reset the buzzer
                broadcast(gameId, { type: 'reset-buzzer' });
            }
        }

        if (data.type === 'clue-selected') {
            const { gameId, clue } = data;

            if (games[gameId]) {
                const clueId = `${clue.value}-${clue.question}`;
                games[gameId].clearedClues.add(clueId); // Add the clue to the cleared set

                // Reset buzzer state when a new clue is selected
                games[gameId].buzzed = null;
                games[gameId].buzzerLocked = true;

                // Broadcast the selected clue to all players in the game
                broadcast(gameId, {
                    type: 'clue-selected',
                    clue,
                    clearedClues: Array.from(games[gameId].clearedClues), // Convert to an array for JSON compatibility
                });

                // Notify players to reset the buzzer and lock it by default
                broadcast(gameId, { type: 'reset-buzzer' });
                broadcast(gameId, { type: 'buzzer-locked' });

            } else {
                console.error(`[Server] Game ID ${gameId} not found when selecting clue.`);
            }
        }

        if (data.type === 'reveal-answer') {
            const { gameId, playerName } = data;

            if (games[gameId]) {
                // Notify all players to display the answer
                broadcast(gameId, {
                    type: 'answer-revealed',
                });
            } else {
                console.error(`[Server] Game ID ${gameId} not found when revealing answer.`);
            }
        }

        if (data.type === 'return-to-board') {
            const { gameId } = data;

            if (games[gameId]) {
                // Notify all clients to return to the board
                broadcast(gameId, {
                    type: 'returned-to-board',
                });
            } else {
                console.error(`[Server] Game ID ${gameId} not found when returning to board.`);
            }
        }

        if (data.type === 'clue-cleared') {
            const { gameId, clueId } = data;

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
            const { gameId } = data;

            if (games[gameId]) {
                games[gameId].buzzerLocked = false; // Unlock the buzzer
                broadcast(gameId, { type: 'buzzer-unlocked' }); // Notify all players
            }
        }

        if (data.type === 'lock-buzzer') {
            const { gameId } = data;

            if (games[gameId]) {
                games[gameId].buzzerLocked = true; // Lock the buzzer
                broadcast(gameId, { type: 'buzzer-locked' }); // Notify all players
            }
        }
    });

    ws.on('close', () => {
        // Remove the player when they disconnect
        Object.keys(games).forEach((gameId) => {
            games[gameId].players = games[gameId].players.filter((p) => p.id !== ws.id);
            broadcast(gameId, {
                type: 'player-list-update',
                players: games[gameId].players.map((p) => p.name),
                host: games[gameId].host,
            });
        });
    });
});

// Broadcast a message to all clients in a game
function broadcast(gameId, message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ gameId, ...message }));
        }
    });
}

