import React from "react";

const MessageOutgoing = () => {
  return (
    <div className="d-flex justify-content-end w-100">
      <div
        className=" d-flex flex-row justify-content-between align-items-center bg-primary text-white mb-3 p-3 l rounded-3 gap-5 shadow"
        style={{ width: "300px" }}
      >
        <div className="d-flex flex-column">
          <h6 className="mt-0">largefile(1).bin</h6>
          <p className="mb-0">29 Feb 2026 14:45:20</p>
        </div>
        <button
          className="btn d-flex bg-white rounded-5 p-2"
          style={{ height: "40px" }}
        >
          <img src="../src/icons/download-blue.png" />
        </button>
      </div>
    </div>
  );
};

export default MessageOutgoing;
