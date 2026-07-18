import React, { useState } from "react";

interface Props {
	togglePairing: () => void;
	onPairingMenu: () => void;
}

const PairingButton = ({ togglePairing, onPairingMenu }: Props) => {
	return (
		<button
			type="button"
			className="btn btn-outline-primary w-100 rounded-3"
			style={{
				height: "44px",
				fontWeight: 600,
			}}
			onClick={() => {
				togglePairing();
				onPairingMenu();
			}}
		>
			Add device
		</button>
	);
};

export default PairingButton;
