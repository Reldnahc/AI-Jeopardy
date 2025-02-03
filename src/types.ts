/** Represents a single clue/question on the board */
export interface Clue {
    value?: number; // The monetary value of the clue/question
    question: string; // The clue/question text
    answer: string; // The answer text
    showAnswer?: boolean; // Indicates whether the answer has been revealed
}

/** Represents a single category with its title and associated clues/questions */
export interface Category {
    category: string; // Title of the category (e.g., "Science")
    values: Clue[];   // Array of clues/questions within the category
}

