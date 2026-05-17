import React from "react";

const MessageIncoming = () => {
  return (
    <div className="d-flex justify-content-start w-100">
      <div
        className="d-flex flex-row justify-content-between align-items-center p-3 mb-3 rounded-3 gap-5 shadow"
        style={{ width: "300px", backgroundColor: "lightgray" }}
      >
        <div className="d-flex flex-column">
          <h6 className="mt-0">largefile(1).bin</h6>
          <p className="mb-0">29 Feb 2026 14:45:20</p>
        </div>
        <button
          className="btn d-flex bg-primary rounded-5 p-2"
          style={{ height: "40px" }}
        >
          <img src="../src/icons/download-white.png" />
        </button>
      </div>
    </div>
  );
};

export default MessageIncoming;
