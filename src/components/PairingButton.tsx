import React, { useState } from "react";

interface Props {
	showMenu: boolean;
	setShowMenu: (showMenu: boolean) => void;
	onAddDevice: () => void;
}

const PairingButton = ({ showMenu, setShowMenu, onAddDevice }: Props) => {
	return (
		<>
			<button
				type="button"
				className="btn btn-outline-primary mb-4"
				onClick={() => {
					setShowMenu(true);
					onAddDevice();
				}}
			>
				Add device
			</button>
		</>
	);
};

export default PairingButton;
