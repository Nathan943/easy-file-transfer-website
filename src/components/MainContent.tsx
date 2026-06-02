import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import PairingMenu from "./PairingMenu";
import { Message, Conversation } from "../types/types";
import MessageDisplay from "./MessageDisplay";

interface Props {
	showMenu: boolean;
	pairingCode: number;
	generatePairingCode: () => void;
	connectWithClient: (pairingCode: string) => void;
	onFileSelect: (file: File) => void;
	messages: Message[];
	isOnline: boolean;
}

const MainContent = ({
	showMenu,
	pairingCode,
	generatePairingCode,
	connectWithClient,
	onFileSelect,
	messages,
	isOnline,
}: Props) => {
	const [isHovered, setIsHovered] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [messages, showMenu]);

	return (
		<div
			className="flex-grow-1 d-flex justify-content-center h-100 pb-4"
			style={{ maxHeight: "100vh" }}
		>
			{showMenu ? (
				<PairingMenu
					pairingCode={pairingCode}
					generatePairingCode={generatePairingCode}
					connectWithClient={connectWithClient}
				/>
			) : (
				<div
					className="d-flex flex-column overflow-auto"
					ref={containerRef}
					style={{ width: "800px", height: "100%" }}
				>
					<div className="mt-auto">
						{messages.map((msg) => (
							<MessageDisplay
								isIncoming={msg.sender != undefined}
								filename={msg.filename}
								timestamp={msg.timestamp}
								downloadUrl={msg.downloadUrl ?? ""}
								key={msg.id}
							/>
						))}
					</div>

					<label
						className={`btn d-flex align-items-center justify-content-center p-2 rounded-5 ${isOnline ? "btn-outline-primary" : "btn-outline-secondary"}`}
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
								fill={
									isHovered
										? "white"
										: isOnline
											? "#0d6efd"
											: "#6c757d"
								}
							/>
						</svg>

						<input
							className=""
							type="file"
							hidden
							disabled={!isOnline}
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) {
									onFileSelect(file);
								}

								e.target.value = "";
							}}
						/>
					</label>
				</div>
			)}
		</div>
	);
};

export default MainContent;
