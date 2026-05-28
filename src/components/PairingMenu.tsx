import React, { ChangeEvent, useState } from "react";

interface Props {
	pairingCode: number;
	generatePairingCode: () => void;
	connectWithClient: (pairingCode: string) => void;
}

const PairingMenu = ({
	pairingCode,
	generatePairingCode,
	connectWithClient,
}: Props) => {
	const [inputCode, setInputCode] = useState("");

	const handleInputCode = (event: ChangeEvent<HTMLInputElement>) => {
		setInputCode(event.target.value);
	};

	return (
		<div
			className="d-flex flex-column justify-content-center"
			style={{ width: "250px" }}
		>
			<h4 className="mb-3">Add device</h4>

			<button
				type="button"
				className="btn btn-outline-primary mb-3"
				onClick={generatePairingCode}
			>
				Generate pairing code
			</button>

			{pairingCode != 0 && (
				<>
					<h2
						className="text-center"
						style={{
							letterSpacing: "8px",
							fontWeight: "bold",
						}}
					>
						{pairingCode}
					</h2>
					<p className="text-center text-secondary">
						Code expires in 60 seconds
					</p>
				</>
			)}

			<div className="text-center text-muted mb-2">OR</div>

			<input
				type="number"
				value={inputCode}
				onChange={handleInputCode}
				className="form-control mb-2"
				placeholder="Enter pairing code..."
			/>

			<button
				className="btn btn-success"
				onClick={() => {
					connectWithClient(inputCode);
				}}
			>
				Connect
			</button>
		</div>
	);
};

export default PairingMenu;
