import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  messages: string[];
  isconnected: boolean;
  chatStatus:
    | "IDLE"
    | "SEARCHING_LEGAL_DOCS"
    | "ANALYZING_CONTEXT"
    | "GENERATING_RESPONSE"
    | "COMPLETED";
  chatStatusMessage: string;
}

type ChatStatus = ChatState["chatStatus"];

const initialState: ChatState = {
  messages: [],
  isconnected: false,
  chatStatus: "IDLE",
  chatStatusMessage: "",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<string>) => {
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
  },
});

export const {
  addMessage,
  clearMessages,
  setConnected,
  setChatStatus,
  setChatStatusMessage,
} = chatSlice.actions;
export default chatSlice.reducer;
