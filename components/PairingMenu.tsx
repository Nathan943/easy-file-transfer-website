import React from "react";

const PairingMenu = () => {
  return (
    <div
      className="d-flex flex-column justify-content-center"
      style={{ width: "250px" }}
    >
      <h4 className="mb-3">Add device</h4>

      <button type="button" className="btn btn-outline-primary mb-3">
        Generate pairing code
      </button>

      <div className="text-center text-muted mb-2">OR</div>

      <input
        type="text"
        className="form-control mb-2"
        placeholder="Enter pairing code..."
      />

      <button className="btn btn-success">Connect</button>
    </div>
  );
};

export default PairingMenu;
