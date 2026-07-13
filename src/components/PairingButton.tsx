import React, { useState } from "react";

interface Props {
	togglePairing: () => void;
	onAddDevice: () => void;
}

const PairingButton = ({ togglePairing, onAddDevice }: Props) => {
	return (
		<>
			<button
				type="button"
				className="btn btn-outline-primary mb-4"
				onClick={() => {
					togglePairing();
					onAddDevice();
				}}
			>
				Add device
			</button>
		</>
	);
};

export default PairingButton;
