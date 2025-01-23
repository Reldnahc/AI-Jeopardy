// src/types.ts
export type Clue = {
    value?: number;
    question?: string;
    answer?: string;
    showAnswer?: boolean; // Optional if not all clues will have this property
};