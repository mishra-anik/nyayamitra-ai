"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import DOMPurify from "dompurify";
import {
  addMessage,
  setConnected,
  setChatStatus,
  setChatStatusMessage,
  setShowDocumentInput,
} from "@/redux/slices/chatSlice";
import HeroText from "@/components/HeroText";
import InputBox from "@/components/InputBox";
import { connectWebSocket, disconnectWebSocket } from "@/lib/socketManager";

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
                inputText:
                  typeof payload.data === "string"
                    ? payload.data
                    : payload.data?.directAnswer || "",
                role: "assistant",
              }),
            );
            break;
          case "ERROR":
            dispatch(setChatStatus("COMPLETED"));
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

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className="w-full">
                  <div className="break-words">
                    <div className="flex w-full items-center gap-2">
                      {msg.image && (
                        <div className="relative h-[9em] w-[7em] shrink-0 overflow-hidden rounded-lg md:h-[7em] mb-[1em]">
                          <Image
                            src={msg.image}
                            alt="Attached image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {msg.document && (
                        <div className=" relative mt-2 flex w-[13em] flex-col items-center gap-2 rounded-lg border bg-primary/10 px-3 py-4 text-center mb-[1em]">
                          <div className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                            {msg.document.type}
                          </div>

                          <p className="w-full truncate text-sm font-medium text-foreground">
                            {msg.document.name}
                          </p>

                          <p className="shrink-0 text-xs text-gray-500">
                            {(msg.document.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>

                    {msg.role === "assistant" ? (
                      <div
                        className="legal-response"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(msg.inputText),
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap bg-primary/10 text-gray-700 w-fit max-w-full px-[1em] py-2 rounded-md shadow-[inset_0_0_10px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.08)]backdrop-blur-md">
                        {msg.inputText}
                      </div>
                    )}

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
            <div ref={bottomRef} />
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
