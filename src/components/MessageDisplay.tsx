import React from "react";

interface Props {
	isIncoming: boolean;
	filename: string;
	timestamp: string;
	downloadUrl: string;
}

const MessageDisplay = ({
	isIncoming,
	filename,
	timestamp,
	downloadUrl,
}: Props) => {
	return (
		<div
			className={`d-flex w-100 ${isIncoming ? "justify-content-start" : "justify-content-end"}`}
		>
			<div
				className={`d-flex flex-row justify-content-between align-items-center mb-3 p-3 rounded-3 gap-5 shadow ${isIncoming && "bg-primary text-white"}`}
				style={{
					width: "300px",
					backgroundColor: isIncoming ? "" : "lightgray",
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
					<p className="mb-0">{timestamp}</p>
				</div>
				<a href={downloadUrl} download={filename}>
					<button
						className={`btn d-flex rounded-5 p-2 ${isIncoming ? "bg-primary" : "bg-white"} `}
						style={{ height: "40px" }}
					>
						<img
							src={
								isIncoming
									? "../src/icons/download-white.png"
									: "../src/icons/download-blue.png"
							}
						/>
					</button>
				</a>
			</div>
		</div>
	);
};

export default MessageDisplay;
