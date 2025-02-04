import { WebSocketServer } from 'ws';
import 'dotenv/config';
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

//ai calls
const openai = new OpenAI();
const anthropic = new Anthropic();
const deepseek = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});
//websockets
const WS_PORT = 3001;
const PING_INTERVAL = 30000; //heartbeats
const wss = new WebSocketServer({ port: WS_PORT, });
console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
//express and supabase
import express from "express"; // Import express
import cors from "cors"; // Import cors
import bodyParser from "body-parser"; // Import body-parser
import { createClient } from "@supabase/supabase-js";
const app = express(); // Initialize Express app
app.use(cors());
app.use(bodyParser.json());
const supabase = createClient(
    'https://ninlqlhpkxyckertjlyh.supabase.co', // Replace with your Supabase API URL
    process.env.SUPABASE_KEY // Replace with your Supabase `service` role key for secure handling
);

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
    category: "Science & Nature",
    description: "Explore the wonders of the natural world and the marvels of modern science."
    };

async function getIdFromUsername(username) {

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username') // Correct syntax for selecting multiple fields
        .eq('username', username.toLowerCase())
        .single(); // Fetch a single matching row

    if (error) {
        console.error('Error fetching ID:', error.message);
        return null; // Return null or throw an error, based on your use case
    }
    return data?.id; // Access the `id` field from `data` and handle potential null values
}

async function getColorFromPlayerName(username) {

    const id = await getIdFromUsername(username);

    const { data, error } = await supabase
        .from('user_profiles')
        .select('color, id')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching color:', error.message);
        return null; // Return null or throw an error, based on your use case
    }
    console.log(data);
    return data?.color;
}

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
            console.log(games);
            console.log(data.gameId);
            console.log(games[data.gameId]);
            ws.send(JSON.stringify({
                type: 'lobby-state',
                gameId: data.gameId,
                players: games[data.gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
                })),
                host: games[data.gameId].host,
                categories: games[data.gameId].categories || [],
            }));
        }
        if (data.type === 'create-lobby') {
            const {gameId, host, categories} = data;

            if (games[gameId]) {
                games[gameId].host = host;

            } else {
                const color = await getColorFromPlayerName(host);
                // Create a new game
                console.log(`Creating new game ${gameId} with host ${host} with color ${color} and categories ${categories}`);
                games[gameId] = {
                    host: host,
                    players: [{id: ws.id, name: host, color: color}],
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
                    gameId: gameId,
                    categories: categories || [],
                    players: [{id: ws.id, name: host, color: color}],
                }));
            }
        }

        if (data.type === 'join-lobby') {
            const {gameId, playerName} = data;
            // Reject blank player names
            if (!playerName || !playerName.trim()) {
                ws.send(JSON.stringify({type: 'error', message: 'Player name cannot be blank.'}));
                return;
            }

            if (!games[gameId]) {
                ws.send(JSON.stringify({type: 'error', message: 'Lobby does not exist!'}));
                return;
            }

            // Check if the player is already in the game based on socket ID
            const existingPlayer = games[gameId].players.find((p) => p.id === ws.id);
            if (existingPlayer) {
                ws.send(JSON.stringify({type: 'info', message: 'You are already in the lobby.'}));
                return;
            }

            // Add the player to the game
            if (!games[gameId].players.includes(playerName)) {
                const color = await getColorFromPlayerName(playerName);
                games[gameId].players.push({id: ws.id, name: playerName, color: color});
            }

            // Log the updated player list for debugging
            console.log(`Players in game ${gameId}:`, games[gameId].players);
            console.log(games[gameId].categories);

            ws.send(JSON.stringify({
                type: 'lobby-state',
                gameId,
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
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
                })),
                host: games[gameId].host,
            });
        }

        if (data.type === 'create-game') {
            const {gameId, categories, selectedModel, host} = data;

            broadcast(gameId, {
                type: 'trigger-loading',
            });

            const boardData = await createBoardData(categories, selectedModel, host);

            console.log(boardData);

            if (!games[gameId]) {
                //error handle
                console.log("error moving from lobby to game. game reference not found.");
            } else if (games[gameId].inLobby) {
                games[gameId].buzzed = null;//TODO this should default
                games[gameId].buzzerLocked = true;//this should default
                games[gameId].clearedClues = new Set();//this should default
                games[gameId].boardData = boardData;
                games[gameId].scores = {}; //this should default
                games[gameId].inLobby = false;

                console.log(games[gameId].players);
                broadcast(gameId, {
                    type: 'start-game',
                    boardData: boardData,
                    players: games[gameId].players.map((p) => ({
                        name: p.name,
                        color: p.color,
                    })),
                });
            }else{
                console.log("error moving from lobby to game. game already in progress.");
            }

        }

        if (data.type === 'check-lobby') {
            const {gameId} = data;
            let isValid = false;
            console.log(games[gameId]);
            if (games[gameId]) {
                isValid = true;
            }

            broadcast(gameId, {
                type: 'check-lobby-response',
                isValid,
            });
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
            const {gameId, playerName} = data;

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
            const {gameId} = data;

            if (games[gameId]) {
                games[gameId].buzzed = null;
                games[gameId].buzzerLocked = true;

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
                    const {firstBoard, secondBoard, finalJeopardy} = game.boardData;
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
                const clueId = `${clue.value}-${clue.question}`;
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
            // Reject blank player names
            console.log(data);
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

            if (!games[gameId].players.includes(playerName)) {
                const color = await getColorFromPlayerName(playerName);
                games[gameId].players.push({id: ws.id, name: playerName, color: color});
            }
            console.log(games[gameId].players);
            // Log the updated player list for debugging
            console.log(`Players in game ${gameId}:`, games[gameId].players);
            // Notify the new player of the current game state (buzz result, buzzer status, board, and selected clue if any)
            ws.send(JSON.stringify({
                type: 'game-state',
                gameId,
                players: games[gameId].players.map((p) => ({
                    name: p.name,
                    color: p.color,
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
                })),
                host: games[gameId].host,
            });
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
                broadcast(gameId, {type: 'buzzer-unlocked'}); // Notify all players
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
                players: games[gameId].players.map((p) => p.name),
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

createCategoryOfTheDay();
setInterval(() => {
    createCategoryOfTheDay();
}, 60000 * 60);

function callOpenAi(model, prompt, temp) {
    return openai.chat.completions.create({
        model: model,
        messages: [{role: "user", content: prompt}],
        store: true,
        temperature: temp,
    });
}

async function createCategoryOfTheDay() {
    console.log("Creating new Category of the day.");
    const prompt = `
        Create a category of the day.
        Think of as many trivia categories as you can. Randomly choose one of these categories.
        Try not to choose the same category you have already chosen.
        create a description for the category.
        the description should be a short single sentence description of the category.
        it should be worded in a fun expressive and brief way.
        Format the response in JSON as:
        {
            "category": "Category Name",
            "description": "description",
        }
    `
    const response = await callOpenAi("gpt-4o-mini", prompt, 1);
    let data;
    if (response.choices && response.choices[0]) {
        data = JSON.parse(response.choices[0].message.content.replace(/```(?:json)?/g, "").trim());
    }
    console.log(data);
    cotd = data;
}

async function createBoardData(categories, model, host) {
    console.log("Beginning to create board data with categories: " + categories);

    if (!categories || categories.length !== 11) {
        return res.status(400).json({error: 'You must provide exactly 11 categories.'});
    }

    const [firstCategories, secondCategories, finalCategory] = [categories.slice(0, 5), categories.slice(5, 10), categories[10]];

    const prompt = (categories, double = false) => `
        Create a Jeopardy board with the following 5 categories: ${categories.join(', ')}.
        Each category should contain 5 questions, each with a value and an answer. Make sure they follow the jeopardy format.
        Each answer should be formated in question like jeopardy. The questions should be more difficult according to their value. 
        The Questions should avoid having the answer in the clue or category title. 
        ${double ? 'Make this a Double Jeopardy board, ensuring values are doubled, ranging from 400 to 2000 instead of 200 to 1000. ' +
        'they should be more difficult according to their value. questions over 500 points should be hard.' : ''}
        Format the response in JSON as:
        {
           "categories": [
                {
                    "category": "Category Name",
                    "values": [
                        { "value": 200, "question": "Question", "answer": "Answer?" },
                        // More values...
                    ]
                },
                // More categories...
            ]
        }
    `;
    const finalPrompt = (category) => `
         Generate me Json for a very difficult question in this category ${category}.
         It should be a very difficult question. Make sure it follows the jeopardy format.
         The answer should be formated in question like jeopardy.
         Format the response in JSON as:
          {
            "categories": [
               {
                   "category": "Category Name",
                   "values": [
                       { "question": "Question", "answer": "Answer?" },
                   ]
               },
            ]
        }
   `;
    function callDeepseek(model, prompt, temp) {
        return deepseek.chat.completions.create({
            model: model,
            messages: [{role: "user", content: prompt}],
            store: true,
            temperature: temp,
        });
    }
    function callAnthropic(model, prompt, temp) {
        return anthropic.messages.create({
            model: model,
            temperature: temp,
            system: "Respond only with valid JSON as described. Do not include any other text.",
            max_tokens: 2000,
            messages: [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        });
    }


    try {
        let apiCall;

        switch (model) {
            case "gpt-4o-mini":
            case "gpt-4o":
            case "o1-mini":
                apiCall = callOpenAi;
                break;
            case "deepseek":
                apiCall = callDeepseek;
                break;
            case "claude-3-5-sonnet-20241022":
                apiCall = callAnthropic;
                break;
        }

        const firstBoardPromise = apiCall(model, prompt(firstCategories), 0.1);
        const secondBoardPromise = apiCall(model, prompt(secondCategories, true), 0.1);
        const finalBoardPromise = apiCall(model, finalPrompt(finalCategory), 0.1);

        const [firstResponse, secondResponse, finalResponse] = await Promise.all([firstBoardPromise, secondBoardPromise, finalBoardPromise]);

        let firstBoard;
        let secondBoard;
        let finalJeopardy;

        if (firstResponse.content && firstResponse.content[0]) {
            firstBoard = JSON.parse(firstResponse.content[0].text.replace(/```(?:json)?/g, "").trim());
            secondBoard = JSON.parse(secondResponse.content[0].text.replace(/```(?:json)?/g, "").trim());
            finalJeopardy = JSON.parse(finalResponse.content[0].text.replace(/```(?:json)?/g, "").trim());
        } else {
            firstBoard = JSON.parse(firstResponse.choices[0].message.content.replace(/```(?:json)?/g, "").trim());
            secondBoard = JSON.parse(secondResponse.choices[0].message.content.replace(/```(?:json)?/g, "").trim());
            finalJeopardy = JSON.parse(finalResponse.choices[0].message.content.replace(/```(?:json)?/g, "").trim());
        }

        const board = {
            host,
            model,
            firstBoard,
            secondBoard,
            finalJeopardy,
        }

        const response = await supabase
            .from('profiles')
            .select('id')
            .eq('username', host.toLowerCase())
            .single();
        console.log(response);
        // Insert the board with the owner's ID
        const { data, error } = await supabase
            .from('jeopardy_boards')
            .insert([{ board, owner: response.data.id }]);

        if (error) {
            console.error('[Server] Error saving board data:', error.message);
        }

        console.log('Jeopardy board saved successfully:', data);


        return {firstBoard, secondBoard, finalJeopardy};
    } catch (error) {
        console.error('[Server] Error generating board data:', error.message);
        console.error(error);
    }
}
