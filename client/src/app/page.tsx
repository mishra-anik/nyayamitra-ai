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
    }
  };

  const LINE_HEIGHT = 20;

  const handleInput = (e) => {
    setInputMessage(e.target.value);

    const textarea = e.target;

    // Check if content needs more than one line

    if (textarea.scrollHeight > LINE_HEIGHT) {
      setRowsNum(2);
    } else {
      setRowsNum(1);
    }
  };

  return (
    <main className="h-full max-w-10xl flex flex-col items-center p-[1em]">
      <div className="w-full max-w-xl mx-auto flex-1 min-h-0 flex flex-col">
        {/* Messages */}
        <div className="flex-1 min-h-0 border border-border bg-surface rounded-lg p-4 mb-4 overflow-y-auto shadow-sm">
          {messages ? (
            messages.map((msg, index) => (
              <div
                key={index}
                className="mb-2 p-2 bg-surface-muted rounded text-text text-sm"
              >
                {msg}
              </div>
            ))
          ) : (
            <HeroText />
          )}
        </div>

        <div className="input-box">
          {/* Plus button */}
          <button
            type="button"
            className=" bottom-2.5 left-3 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
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
            rows={!inputMessage?1 :rowsNum}
            className="flex-1"
          />

          {/* Send arrow */}
          <button
            type="button"
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className="bg-primary hover:bg-primary"
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
