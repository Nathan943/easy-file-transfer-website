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
			className={`d-flex w-100  ${isIncoming ? "justify-content-center" : "justify-content-center"}`}
		>
			<div
				className={`d-flex flex-row justify-content-between align-items-center mb-3 p-3 rounded-3 gap-4 shadow ${!isIncoming && "bg-primary text-white"}`}
				style={{
					width: "300px",
					backgroundColor: isIncoming ? "lightgray" : "",
					marginLeft: isIncoming ? "350px" : "",
					marginRight: !isIncoming ? "350px" : "",
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
