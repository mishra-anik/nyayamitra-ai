import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  inputText: string;
  role: "user" | "assistant";
  chatId?: string;
}

export interface DocumentDetails {
  name: string;
  size: number;
  type: "pdf" | "doc" | "docx";
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
  showDocumentInput: boolean;
  selectedDocument: DocumentDetails | null;
  selectedImage: string| null;
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
    },
    setShowDocumentInput: (state, action: PayloadAction<boolean>) => {
      state.showDocumentInput = action.payload;
    },
    setSelectedDocument: (
      state,
      action: PayloadAction<DocumentDetails | null>,
    ) => {
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




// {pdfFile && (
//   <div className="flex w-fit max-w-[280px] items-center gap-2 rounded-xl border bg-white p-2 shadow-sm">
//     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-semibold text-red-600">
//       PDF
//     </div>

//     <div className="min-w-0">
//       <p className="truncate text-sm font-medium">
//         {pdfFile.name}
//       </p>

//       <p className="text-xs text-gray-500">
//         {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
//       </p>
//     </div>
//   </div>
// )}
