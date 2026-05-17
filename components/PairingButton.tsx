import React, { useState } from "react";

interface Props {
  showMenu: boolean;
  setShowMenu: (showMenu: boolean) => void;
}

const PairingButton = ({ showMenu, setShowMenu }: Props) => {
  return (
    <>
      <button
        type="button"
        className={
          showMenu ? "btn btn-primary mb-4" : "btn btn-outline-primary mb-4"
        }
        onClick={() => setShowMenu(!showMenu)}
      >
        Add device
      </button>
    </>
  );
};

export default PairingButton;
