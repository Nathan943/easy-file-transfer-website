import React, { useContext, useState } from "react";
import { ThemeMode, useTheme } from "../context/ThemeContext";

interface Props {
	name: string;
	editName: (name: string) => void;
	toggleSettings: () => void;
	onSettingsMenu: () => void;
}

const SettingsPopup = ({
	name,
	editName,
	toggleSettings,
	onSettingsMenu,
}: Props) => {
	const [open, setOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const [editIsHovered, setEditIsHovered] = useState(false);
	const [settingsIsHovered, setSettingsIsHovered] = useState(false);

	const [editing, setEditing] = useState(false);
	const [newName, setNewName] = useState(name);

	const { theme, themeMode } = useTheme();

	return (
		<div className="position-relative w-100 border-top mb-2 p-2 pb-0 ">
			{editing ? (
				<input
					className="form-control fs-5 fw-bold p-3 shadow-none"
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
							open || isHovered
								? theme.selected
								: theme.background,
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
					className="position-absolute d-flex flex-column rounded-3 p-2"
					style={{
						width: "282px",
						bottom: "calc(100% + 10px)",
						overflow: "hidden",
						backgroundColor: theme.settingsPopupBackground,
					}}
				>
					<button
						className={`w-100 p-2 ps-3 text-start rounded-3 border-0 d-flex flex-row align-items-center btn ${themeMode == "light" ? "btn-light" : "btn-dark"}`}
						style={{
							backgroundColor: editIsHovered
								? theme.hover
								: theme.settingsPopupBackground,
						}}
						onClick={() => {
							setOpen(false);
							setNewName(name);
							setEditing(true);
							setEditIsHovered(false);
						}}
						onMouseEnter={() => setEditIsHovered(true)}
						onMouseLeave={() => setEditIsHovered(false)}
					>
						<img
							src={
								themeMode == "light"
									? "../src/icons/edit-light.png"
									: "../src/icons/edit-dark.png"
							}
							style={{
								width: "18px",
								height: "18px",
								marginRight: "12px",
							}}
						/>
						Change Name
					</button>
					<button
						className={`w-100 p-2 ps-3 text-start rounded-3 border-0 d-flex flex-row align-items-center btn`}
						style={{
							backgroundColor: settingsIsHovered
								? theme.hover
								: theme.settingsPopupBackground,
						}}
						onClick={() => {
							toggleSettings();
							setOpen(false);
							setSettingsIsHovered(false);
							onSettingsMenu();
						}}
						onMouseEnter={() => setSettingsIsHovered(true)}
						onMouseLeave={() => setSettingsIsHovered(false)}
					>
						<img
							src={
								themeMode == "light"
									? "../src/icons/settings-light.png"
									: "../src/icons/settings-dark.png"
							}
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
