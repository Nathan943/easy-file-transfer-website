import React, { useState } from "react";

interface Props {
	name: string;
	editName: (name: string) => void;
	toggleSettings: () => void;
}

const SettingsPopup = ({ name, editName, toggleSettings }: Props) => {
	const [open, setOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const [editing, setEditing] = useState(false);
	const [newName, setNewName] = useState(name);

	return (
		<div className="position-relative w-100 border-top mb-2 p-2 pb-0 ">
			{editing ? (
				<input
					className="form-control fs-5 fw-bold p-3"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					autoFocus
					onBlur={() => {
						editName(newName);
						setEditing(false);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							editName(newName);
							setEditing(false);
						}

						if (e.key === "Escape") {
							setNewName(name);
							setEditing(false);
						}
					}}
				/>
			) : (
				<button
					className="form-control btn w-100 fs-5 text-start shadow-none p-3"
					style={{
						fontWeight: "bold",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						boxShadow: "none",
						backgroundColor:
							open || isHovered ? "#d6d9db" : "white",
					}}
					onClick={(e) => {
						setOpen(!open);
						e.currentTarget.blur();
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					{name}
				</button>
			)}

			{open && (
				<div
					className="position-absolute d-flex flex-column rounded-3"
					style={{
						width: "282px",
						bottom: "calc(100% + 8px)",
						overflow: "hidden",
					}}
				>
					<button
						className="btn btn-light w-100 p-2 ps-3 text-start rounded-3 border-0 d-flex flex-row align-items-center"
						onClick={() => {
							setOpen(false);
							setNewName(name);
							setEditing(true);
						}}
					>
						<img
							src="../src/icons/edit.png"
							style={{
								width: "18px",
								height: "18px",
								marginRight: "12px",
							}}
						/>
						Change Name
					</button>
					<button
						className="btn btn-light w-100 p-2 ps-3 text-start rounded-3 border-0 d-flex flex-row align-items-center"
						onClick={() => toggleSettings()}
					>
						<img
							src="../src/icons/settings.png"
							style={{
								width: "18px",
								height: "18px",
								marginRight: "12px",
							}}
						/>
						Settings
					</button>
				</div>
			)}
		</div>
	);
};

export default SettingsPopup;
