import React, { useState } from "react";
import PairingMenu from "./PairingMenu";
import { Message, Conversation } from "../types/types";
import MessageDisplay from "./MessageDisplay";

interface Props {
  showMenu: boolean;
  onFileSelect: (file: File) => void;
  messages: Message[];
}

const MainContent = ({ showMenu, onFileSelect, messages }: Props) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex-grow-1 d-flex justify-content-center">
      {showMenu ? (
        <PairingMenu />
      ) : (
        <div
          className="d-flex flex-column justify-content-end mb-5 p-3"
          style={{ width: "700px" }}
        >
          {messages.map((msg) => (
            <MessageDisplay
              sender={msg.sender}
              filename={msg.filename}
              timestamp={msg.timestamp}
              downloadUrl={msg.downloadUrl}
              key={msg.id}
            />
          ))}

          <label
            className="btn btn-outline-primary d-flex align-items-center justify-content-center p-2 rounded-5"
            style={{
              width: "50px",
              height: "50px",
              position: "absolute",
              bottom: "60px",
              right: "60px",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M58.8751 30.375C58.8751 33.6197 56.2448 36.25 53.0001 36.25H35.3751V53.875C35.3751 57.1197 32.7448 59.75 29.5001 59.75C26.2554 59.75 23.6251 57.1197 23.6251 53.875V36.25H5.875C2.63033 36.25 0 33.6197 0 30.375C0 27.1303 2.63033 24.5 5.875 24.5H23.6251V5.875C23.6251 2.63033 26.2554 4.76837e-07 29.5001 4.76837e-07C32.7448 4.76837e-07 35.3751 2.63033 35.3751 5.875V24.5C35.3751 24.5 49.7554 24.5 53.0001 24.5C56.2448 24.5 58.8751 27.1303 58.8751 30.375Z"
                fill={isHovered ? "white" : "#0d6efd"}
              />
            </svg>

            <input
              className=""
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileSelect(file);
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default MainContent;
