"use client";
import { useState, useEffect, useRef } from "react";
import HeroText from "@/components/HeroText";

const Home = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [rowsNum, setRowsNum] = useState<number>(1);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws/chat");
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "FINAL_RESPONSE") {
          const responseText =
            typeof payload.data === "string"
              ? payload.data
              : JSON.stringify(payload.data, null, 2);
          setMessages((prevMessages) => [...prevMessages, responseText]);
          return;
        }

        if (payload.type === "ERROR") {
          setMessages((prevMessages) => [
            ...prevMessages,
            `Error: ${payload.message}`,
          ]);
          return;
        }

        if (payload.type === "STATUS") {
          setMessages((prevMessages) => [
            ...prevMessages,
            `Status: ${payload.status}`,
          ]);
          return;
        }

        setMessages((prevMessages) => [...prevMessages, event.data]);
      } catch {
        setMessages((prevMessages) => [...prevMessages, event.data]);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = () => {
      setIsConnected(false);
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
  }, []);

  const sendMessage = () => {
    if (socketRef.current && isConnected && inputMessage.trim()) {
      socketRef.current.send(JSON.stringify({ inputMessage }));
      setInputMessage("");
      setRowsNum(1);
    }
  };

  const LINE_HEIGHT = 20;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);

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
    <main className="flex h-full  w-full items-center justify-center bg-background p-3 sm:p-5">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-3">
        <div
          className={
            messages.length === 0
              ? "w-full px-2 py-0"
              : "flex-1 min-h-0 overflow-y-auto rounded-[28px] border border-border/70 bg-surface/70 px-2 py-3 shadow-[0_18px_50px_rgba(36,48,47,0.08)] backdrop-blur-sm sm:px-4"
          }
        >
          {messages.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center sm:min-h-[260px]">
              <HeroText />
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {messages.map((msg, index) => (
                <div key={index} className="flex w-full justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm leading-6 text-text shadow-sm sm:max-w-[80%]">
                    {msg}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-box w-full max-w-3xl self-center">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
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
          <textarea
            value={inputMessage}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message..."
            rows={inputMessage.trim() ? 1 : rowsNum}
            className="flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-5 text-foreground placeholder:text-muted focus:outline-none"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-hover"
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
              <path d="m5 12 14-7-3 7 3 7-14-7Z" />
              <path d="M5 12h11" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Home;
