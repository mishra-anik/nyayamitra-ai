import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  inputText: string;
  role: "user" | "assistant";
  chatId?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isconnected: boolean;
  chatStatus:
    | "IDLE"
    | "SEARCHING_LEGAL_DOCS"
    | "ANALYZING_CONTEXT"
    | "GENERATING_RESPONSE"
    | "COMPLETED";
  chatStatusMessage: string;
  activeChatId: string; 
  inputMessage: ChatMessage;
}

type ChatStatus = ChatState["chatStatus"];

const initialState: ChatState = {
  messages: [],
  isconnected: false,
  chatStatus: "IDLE",
  chatStatusMessage: "",
  activeChatId: "",
  inputMessage: {
    inputText: "",
    role: "user",
    chatId: "",
  },
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isconnected = action.payload;
    },
    setChatStatus: (state, action: PayloadAction<ChatStatus>) => {
      state.chatStatus = action.payload;
    },
    setChatStatusMessage: (state, action: PayloadAction<string>) => {
      state.chatStatusMessage = action.payload;
    },
    setActiveChatId: (state, action: PayloadAction<string>) => {
      state.activeChatId = action.payload;
    },
    setInputMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.inputMessage = action.payload;
    }
  },
});

export const {
  addMessage,
  clearMessages,
  setConnected,
  setChatStatus,
  setChatStatusMessage,
  setActiveChatId,
  setInputMessage,
} = chatSlice.actions;
export default chatSlice.reducer;
