/** An earlier turn of a conversation, as the model reads it with a follow-up question. */
export interface AskContextTurn {
  question: string;
  answer: string;
}
