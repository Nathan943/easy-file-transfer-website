import React from "react";
import { ThemeMode, useTheme } from "../context/ThemeContext";

interface Props {}

const Settings = ({}: Props) => {
	const { theme, themeMode, setThemeMode } = useTheme();

	return (
		<div
			className="d-flex flex-column justify-content-start p-5 gap-5"
			style={{ width: "40%" }}
		>
			<h2 className="fw-bold pt-5">Settings</h2>

			<div>
				<h5 className="fw-normal">General</h5>
				<hr />
				<div className="d-flex flex-row justify-content-between align-items-center">
					<h6 className="fw-normal mb-0">Theme</h6>
					<select
						name="theme"
						value={themeMode}
						onChange={(e) =>
							setThemeMode(e.target.value as ThemeMode)
						}
						className="border-0"
						style={{
							outline: 0,
							backgroundColor: theme.background,
						}}
					>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
						<option value="system">System</option>
					</select>
				</div>
			</div>

			<div>
				<h5 className="fw-normal">Transfers</h5>
				<hr />
				<div className="d-flex flex-row justify-content-between align-items-center mb-3">
					<h6 className="fw-normal mb-0">Download automatically</h6>
					<div className="form-check form-switch">
						<input
							className="form-check-input shadow-none"
							style={{
								border: "1px solid #a1a6ac",
								transform: "scale(1.2)",
							}}
							type="checkbox"
							role="switch"
						/>
					</div>
				</div>

				<div className="d-flex flex-row justify-content-between align-items-center">
					<h6 className="fw-normal mb-0">Clear all transfer data</h6>
					<button className="btn btn-outline-danger p-1 px-2">
						Clear all transfer data
					</button>
				</div>
			</div>

			<div>
				<h5 className="fw-normal">Devices</h5>
				<hr />
				<div className="d-flex flex-row justify-content-between align-items-center mb-3">
					<h6 className="fw-normal mb-0">Show offline devices</h6>
					<div className="form-check form-switch">
						<input
							className="form-check-input shadow-none"
							style={{
								border: "1px solid #a1a6ac",
								transform: "scale(1.2)",
							}}
							type="checkbox"
							role="switch"
						/>
					</div>
				</div>
				<div className="d-flex flex-row justify-content-between align-items-center">
					<h6 className="fw-normal mb-0">Forget all devices</h6>
					<button className="btn btn-outline-danger p-1 px-2">
						Forget all devices
					</button>
				</div>
			</div>

			<div>
				<h5 className="fw-normal">About</h5>
				<hr />
				<h6 className="fw-normal mb-2">Version 1.0.0</h6>
				<a
					href="https://github.com/Nathan943/easy-file-transfer-website"
					target="_blank"
					className={
						themeMode == "light" ? "text-dark" : "text-light"
					}
				>
					GitHub
				</a>
			</div>
		</div>
	);
};

export default Settings;
