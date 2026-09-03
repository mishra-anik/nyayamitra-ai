"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addMessage,
  setConnected,
  setChatStatus,
  setChatStatusMessage,
  setShowDocumentInput,
} from "@/redux/slices/chatSlice";
import HeroText from "@/components/HeroText";
import InputBox from "@/components/InputBox";
import {
  connectWebSocket,
  disconnectWebSocket,
} from "@/redux/socketManager/socketManager";

const Home = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.chat.messages);
  const chatStatus = useAppSelector((state) => state.chat.chatStatus);
  const chatStatusMessage = useAppSelector(
    (state) => state.chat.chatStatusMessage,
  );
  const selectedImage = useAppSelector((state) => state.chat.selectedImage);
  const selectedDocument = useAppSelector(
    (state) => state.chat.selectedDocument,
  );
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);
  const showDocumentInput = useAppSelector(
    (state) => state.chat.showDocumentInput,
  );

  useEffect(() => {
    const socket = connectWebSocket();
    socketRef.current = socket;

    socket.onopen = () => {
      dispatch(setConnected(true));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        switch (payload.type) {
          case "STATUS":
            dispatch(setChatStatus(payload.status));
            dispatch(setChatStatusMessage(payload.message));
            break;
          case "FINAL_RESPONSE":
            dispatch(
              addMessage({
                inputText: payload.data.directAnswer,
                role: "assistant",
              }),
            );
            break;
          case "ERROR":
            dispatch(
              addMessage({
                inputText: `Error: ${payload.message}`,
                role: "assistant",
              }),
            );
            break;
        }
      } catch {
        // Non-JSON response
        dispatch(addMessage(event.data));
      }
    };

    socket.onclose = () => {
      dispatch(setConnected(false));
    };

    socket.onerror = () => {
      dispatch(setConnected(false));
    };

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <main className="flex h-[100dvh] w-full flex-col px-4 py-2">
      {showDocumentInput && (
        <div
          className="absolute w-full h-full inset-0 z-40 "
          onClick={() => dispatch(setShowDocumentInput(false))}
        />
      )}
      {/* ================= MESSAGE AREA ================= */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden scrollbar-hide">
        {messages.length === 0 &&
        selectedImage === null &&
        selectedDocument === null ? (
          <div className="flex flex-1 items-center justify-center">
            <HeroText />
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto px-2 pb-[1em] pt-[2em] rounded-lg bg-gradient-to-b from-surface to-surface-muted scrollbar-hide">
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className="w-full">
                  <div
                    className={`whitespace-pre-wrap break-words ${msg.role === "user" ? "text-muted " : "text-foreground "}`}
                  >
                    {msg.inputText}
                    {msg.chatId === activeChatId &&
                      chatStatus !== "IDLE" &&
                      chatStatus !== "COMPLETED" &&
                      chatStatusMessage && (
                        <div
                          className="px-4 py-2 text-sm text-muted"
                          role="status"
                        >
                          {chatStatusMessage}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= INPUT ================= */}
      <InputBox socketRef={socketRef} />

      {/* Mobile bottom spacing so messages aren't hidden behind input */}
      <div className="h-16 shrink-0 md:hidden" />
    </main>
  );
};

export default Home;
