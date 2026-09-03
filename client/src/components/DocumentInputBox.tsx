import React from "react";
import { useState, useRef } from "react";
const DocumentInputBox = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className=" fixed w-[5rem] h-auto bottom-[5em] bg-color-primary/10 rounded-lg flex flex-col gap-2 p-2 z-50">
      <div
        className="mt-2 flex justify-start gap-2 text-color-primary text-sm cursor-pointer items-center"
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
        className="mt-2 flex justify-start gap-2 text-color-primary text-sm cursor-pointer items-center"
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
          ref={imageInputRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default DocumentInputBox;
