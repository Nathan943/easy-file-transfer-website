import React from "react";

interface Props {
	isIncoming: boolean;
	filename: string;
	timestamp: string;
	downloadUrl: string;
	status: "sending" | "sent" | "failed";
	progress?: number;
}

const MessageDisplay = ({
	isIncoming,
	filename,
	timestamp,
	downloadUrl,
	status,
	progress,
}: Props) => {
	return (
		<div className="d-flex w-100 justify-content-center">
			<div
				className={`d-flex flex-row justify-content-between align-items-center mb-3 p-3 rounded-3 gap-4 shadow ${!isIncoming && "bg-primary text-white"}`}
				style={{
					width: "300px",
					backgroundColor: isIncoming ? "lightgray" : "",
					marginLeft: !isIncoming ? "350px" : "",
					marginRight: isIncoming ? "350px" : "",
				}}
			>
				<div className="d-flex flex-column" style={{ minWidth: 0 }}>
					<h6
						className="mt-0"
						style={{
							overflowWrap: "break-word",
							wordBreak: "break-word",
						}}
					>
						{filename}
					</h6>
					<p className="mb-0">
						{status == "failed"
							? "Failed to send"
							: status == "sent"
								? timestamp
								: ""}
					</p>
					{status == "sending" && (
						<svg
							width="200"
							height="20"
							viewBox="-2 -2 404 20"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect
								width="400"
								height="20"
								rx="10"
								ry="10"
								fill="none"
								stroke={isIncoming ? "black" : "white"}
								strokeWidth="3"
							/>

							<rect
								width={(progress ?? 0) * 400}
								height="20"
								rx="10"
								ry="10"
								fill={isIncoming ? "black" : "white"}
								stroke={isIncoming ? "black" : "white"}
								strokeWidth="3"
							/>
						</svg>
					)}
				</div>
				{downloadUrl && (
					<a href={downloadUrl} download={filename} className="m-2">
						<img
							style={{ width: "20px" }}
							src={
								isIncoming
									? "../src/icons/download-blue.png"
									: "../src/icons/download-white.png"
							}
						/>
					</a>
				)}
			</div>
		</div>
	);
};

export default MessageDisplay;
