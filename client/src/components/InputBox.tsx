"use client";

import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import DocumentInputBox from "@/components/DocumentInputBox";
import {
  addMessage,
  setActiveChatId,
  setInputMessage,
  setShowDocumentInput,
  setSelectedDocument,
  setSelectedImage,
} from "@/redux/slices/chatSlice";
import { useState } from "react";
import Image from "next/image";

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
  const showDocumentInput = useAppSelector(
    (state) => state.chat.showDocumentInput,
  );
  const selectedImage = useAppSelector((state) => state.chat.selectedImage);
  const selectedDocument = useAppSelector(
    (state) => state.chat.selectedDocument,
  );

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
    const storedDocument = localStorage.getItem("selectedDocument");
    const storedImage = localStorage.getItem("selectedImage");

    if (
      socketRef.current &&
      isConnected &&
      (inputMessage.inputText.trim() || storedDocument || storedImage)
    ) {
      socketRef.current.send(
        JSON.stringify({
          inputMessage: inputMessage.inputText,
          image: storedImage,
          document: storedDocument ? JSON.parse(storedDocument) : null,
        }),
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

      //clear selected file
      dispatch(setSelectedDocument(null));
      dispatch(setSelectedImage(null));

      localStorage.removeItem("selectedDocument");
      localStorage.removeItem("selectedImage");
      
      setRowsNum(1);
    }
  };

  return (
    <div
      className={`
    fixed bottom-[1em] left-0 right-0 z-50 bg-background px-4 pb-3 pt-2
    md:static
    md:mx-auto
    md:w-full
    md:max-w-3xl
    md:bg-transparent
    md:px-0
    md:pb-2
    ${messages.length === 0 && selectedImage === null && selectedDocument === null ? "md:-translate-y-[15em]" : ""}
  `}
    >
      <div className="fixed bottom-[6em] md:bottom-[5em] z-50 flex   items-center gap-2 rounded-xl  p-2 transition ease-in">
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            showDocumentInput
              ? "max-h-40 max-w-xs translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 max-w-0 -translate-y-2 opacity-0"
          }`}
        >
          <DocumentInputBox />
        </div>

        {selectedImage && (
          <div className="relative md:h-[7em] h-[9em] w-[7em] shrink-0 overflow-hidden rounded-lg">
            <Image
              src={selectedImage}
              alt="Selected image"
              fill
              className="object-cover"
            />

            <button
              type="button"
              className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-black/60 text-xs text-white"
              onClick={() => {
                dispatch(setSelectedImage(null));
                localStorage.removeItem("selectedImage");
              }}
            >
              ×
            </button>
          </div>
        )}

        {selectedDocument && (
          <div className="relative flex flex-col items-center justify-center gap-2 md:h-[7em] h-[9em] w-[7em] shrink-0 overflow-hidden rounded-lg border bg-primary/10">
            <div className="flex h-auto px-4 py-2 w-auto shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-semibold text-red-600">
              {selectedDocument.type}
            </div>

            {/* <div className="min-w-0"> */}
            <p className="w-auto px-2 text-sm font-medium">
              {selectedDocument.name}
            </p>
            <p className="text-xs text-gray-500">
              {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-black/60 text-xs text-white"
              onClick={() => {
                dispatch(setSelectedDocument(null));
                localStorage.removeItem("selectedDocument");
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="input-box ">
        {/* Plus button */}

        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          onClick={() => {
            dispatch(setShowDocumentInput(!showDocumentInput));
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
          disabled={
            !isConnected ||
            (!inputMessage.inputText.trim() &&
              !selectedImage &&
              !selectedDocument)
          }
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
