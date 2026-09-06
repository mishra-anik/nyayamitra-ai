import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  inputText: string;
  role: "user" | "assistant";
  chatId?: string;
  image?: string | null;
  document?: FileDetails | null;
}

export interface FileDetails {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  chatStatus:
    | "IDLE"
    | "SEARCHING_LEGAL_DOCS"
    | "ANALYZING_CONTEXT"
    | "GENERATING_RESPONSE"
    | "COMPLETED";
  chatStatusMessage: string;
  activeChatId: string;
  inputMessage: ChatMessage;
  showDocumentInput: boolean;
  selectedDocument: FileDetails | null;
  selectedImage: string | null;
}

type ChatStatus = ChatState["chatStatus"];

const initialState: ChatState = {
  messages: [],
  isConnected: false,
  chatStatus: "IDLE",
  chatStatusMessage: "",
  activeChatId: "",
  inputMessage: {
    inputText: "",
    role: "user",
    chatId: "",
  },
  showDocumentInput: false,
  selectedDocument: null,
  selectedImage: null,
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
      state.isConnected= action.payload;
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
    },
    setShowDocumentInput: (state, action: PayloadAction<boolean>) => {
      state.showDocumentInput = action.payload;
    },
    setSelectedDocument: (state, action: PayloadAction<FileDetails | null>) => {
      state.selectedDocument = action.payload;
    },

    setSelectedImage: (state, action: PayloadAction<string | null>) => {
      state.selectedImage = action.payload;
    },
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
  setShowDocumentInput,
  setSelectedImage,
  setSelectedDocument,
} = chatSlice.actions;
export default chatSlice.reducer;
