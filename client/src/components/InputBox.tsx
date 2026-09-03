"use client";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import DocumentInputBox from "@/components/DocumentInputBox";
import {
  addMessage,
  setActiveChatId,
  setInputMessage,
} from "@/redux/slices/chatSlice";
import { useState } from "react";

const InputBox = ({
  socketRef,
}: {
  socketRef: React.RefObject<WebSocket | null>;
}) => {
  const [rowsNum, setRowsNum] = useState<number>(1);
  const dispatch = useAppDispatch();
  const isConnected = useAppSelector((state) => state.chat.isconnected);
  const inputMessage = useAppSelector((state) => state.chat.inputMessage);
  const messages = useAppSelector((state) => state.chat.messages);
const [showDocumentInput, setShowDocumentInput] = useState(false);

  const LINE_HEIGHT = 20;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    dispatch(setInputMessage({ ...inputMessage, inputText: value }));

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

  const sendMessage = () => {
    const chatId = crypto.randomUUID();

    if (socketRef.current && isConnected && inputMessage.inputText.trim()) {
      socketRef.current.send(
        JSON.stringify({ inputMessage: inputMessage.inputText }),
      );
      dispatch(addMessage({ ...inputMessage, chatId }));
      dispatch(setActiveChatId(chatId));

      dispatch(
        setInputMessage({
          inputText: "",
          role: "user",
          chatId: "",
        }),
      );

      setRowsNum(1);
    }
  };

  return (
    <div
      className={`
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
    ${messages.length === 0 ? "md:-translate-y-[15em]" : ""}
  `}
    >
      <div className="input-box ">
        {/* Plus button */}

        {showDocumentInput && (
          <DocumentInputBox
           
          />
        )}
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          onClick={() => {
            setShowDocumentInput(true);
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
  );
};



export default InputBox;
