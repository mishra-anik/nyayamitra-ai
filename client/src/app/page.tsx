"use client";

import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addMessage,
  setConnected,
  setChatStatus,
  setChatStatusMessage,
  setActiveChatId,
} from "@/redux/slices/chatSlice";
import type { ChatMessage } from "@/redux/slices/chatSlice";
import HeroText from "@/components/HeroText";

const Home = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.chat.messages);
  const isConnected = useAppSelector((state) => state.chat.isconnected);
  const chatStatus = useAppSelector((state) => state.chat.chatStatus);
  const chatStatusMessage = useAppSelector(
    (state) => state.chat.chatStatusMessage,
  );
  const activeChatId = useAppSelector((state) => state.chat.activeChatId);

  const [inputMessage, setInputMessage] = useState<ChatMessage>({
    inputText: "",
    role: "user",
    chatId: "",
  });
  const [rowsNum, setRowsNum] = useState<number>(1);

  useEffect(() => {
    const socket = new WebSocket(
      "wss://nyayamitra-ai-3202.onrender.com/ws/chat",
    );

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
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }

      if (socketRef.current === socket) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
      }
    };
  }, [dispatch]);

  const sendMessage = () => {
    const chatId = crypto.randomUUID();

    if (socketRef.current && isConnected && inputMessage.inputText.trim()) {
      socketRef.current.send(
        JSON.stringify({ inputMessage: inputMessage.inputText }),
      );
      dispatch(addMessage({ ...inputMessage, chatId }));
      dispatch(setActiveChatId(chatId));

      setInputMessage({ inputText: "", role: "user" , chatId: ""});
      setRowsNum(1);
    }
  };

  const LINE_HEIGHT = 20;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    setInputMessage({ ...inputMessage, inputText: value });

    const textarea = e.target;

    if (value.trim() === "") {
      setRowsNum(1);
      return;
    }

    if (textarea.scrollHeight > LINE_HEIGHT) {
      setRowsNum(2);
    } else {
      setRowsNum(1);
    }
  };

  return (
    <main className="flex h-[100dvh] w-full flex-col px-4 py-2">
      {/* ================= MESSAGE AREA ================= */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <HeroText />
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-[2em] rounded-lg bg-gradient-to-b from-surface to-surface-muted scrollbar-hide">
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
      <div
        className="
          fixed bottom-[1em] left-0 right-0
          z-50
          bg-background
          px-4 pb-3 pt-2
          md:static
          md:mx-auto
          md:w-full
          md:max-w-3xl
          md:bg-transparent
          md:px-0
          md:pb-2
        "
      >
        <div className="input-box ">
          {/* Plus button */}
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            onClick={() => {
              // Handle attachment/menu
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            value={inputMessage.inputText}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message..."
            rows={inputMessage.inputText.trim() ? 1 : rowsNum}
            className="flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-5 text-foreground placeholder:text-muted focus:outline-none"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.inputText.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-hover disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12 5 5l3 7-3 7 14-7Z" />
              <path d="M19 12H8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile bottom spacing so messages aren't hidden behind input */}
      <div className="h-16 shrink-0 md:hidden" />
    </main>
  );
};

export default Home;
