import { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
	autoDownload: boolean;
	setAutoDownload: (autoDownload: boolean) => void;
	showOffline: boolean | true;
	setShowOffline: (showOffline: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined,
);

export const SettingsProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [autoDownload, setAutoDownload] = useState<boolean>(
		() => localStorage.getItem("autoDownload") == "true",
	);

	const [showOffline, setShowOffline] = useState<boolean>(
		() => localStorage.getItem("showOffline") != "false",
	);

	useEffect(() => {
		localStorage.setItem("autoDownload", String(autoDownload));
	}, [autoDownload]);

	return (
		<SettingsContext.Provider
			value={{
				autoDownload,
				setAutoDownload,
				showOffline,
				setShowOffline,
			}}
		>
			{children}
		</SettingsContext.Provider>
	);
};

export const useSettings = () => {
	const context = useContext(SettingsContext);

	if (!context) {
		throw new Error("Issue with SettingsContext");
	}

	return context;
};
