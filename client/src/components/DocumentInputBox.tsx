"use client";

import React from "react";
import { useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setSelectedDocument,
  setSelectedImage,
  setShowDocumentInput,
} from "@/redux/slices/chatSlice";
const DocumentInputBox = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const dispatch = useAppDispatch();
  const selectedImage = useAppSelector((state) => state.chat.selectedImage);
  const selectedDocument = useAppSelector(
    (state) => state.chat.selectedDocument,
  );
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const extension = file.name.split(".").pop()?.toLowerCase();

      // PDF, DOC, DOCX
      if (!["pdf", "doc", "docx"].includes(extension || "")) {
        alert("Only PDF, DOC, and DOCX files are allowed.");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          localStorage.setItem(
            "selectedDocument",
            JSON.stringify({
              name: file.name,
              size: file.size,
              type: extension,
              data: reader.result,
            }),
          );
          if (selectedDocument) {
            dispatch(setSelectedDocument(null));
          }
          dispatch(
            setSelectedDocument({
              name: file.name,
              size: file.size,
              type: extension as "pdf" | "doc" | "docx",
            }),
          );
        } catch {
          alert("This document is too large to store in browser storage.");
        } finally {
          dispatch(setShowDocumentInput(false));
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Images only
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem("selectedImage", reader.result as string);
      };

      reader.readAsDataURL(file);

      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }

      dispatch(setSelectedImage(URL.createObjectURL(file)));
    }
    dispatch(setShowDocumentInput(false));
  };

  return (
    <div>
      <div
        className="mt-2 mb-4 flex justify-start gap-2 text-color-primary text-sm cursor-pointer items-center"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        <h2 className="text-sm text-gray-500">Add Document</h2>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
      </div>
      <div
        className="mt-2 mb-4 flex justify-start gap-2 text-color-primary text-sm cursor-pointer items-center"
        onClick={() => imageInputRef.current?.click()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <h2 className="text-sm text-gray-500">Add Image</h2>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          ref={imageInputRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default DocumentInputBox;
