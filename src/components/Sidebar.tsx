import React, { use, useState } from "react";
import Name from "./Name";
import ClientList from "./ClientList";
import PairingButton from "./PairingButton";
import { Client } from "../types/types";

interface Props {
	clients: Client[];
	name: string;
	editName: (name: string) => void;
	onSelectClient: (client: Client) => void;
	showMenu: boolean;
	setShowMenu: (showMenu: boolean) => void;
	deleteClient: (client: Client) => void;
}

const Sidebar = ({
	clients,
	name,
	onSelectClient,
	showMenu,
	setShowMenu,
	editName,
	deleteClient,
}: Props) => {
	const [deselect, setDeselect] = useState(0);

	return (
		<div
			className="navbar flex-column align-items-start justify-content-start p-4 border rounded-0"
			style={{ width: "300px", borderRadius: "10px" }}
		>
			<PairingButton
				showMenu={showMenu}
				setShowMenu={setShowMenu}
				onAddDevice={() => {
					setDeselect((prev) => prev + 1);
				}}
			/>
			<ClientList
				clients={clients}
				onSelectClient={onSelectClient}
				deselect={deselect}
				deleteClient={deleteClient}
			/>
			<Name name={name} editName={editName} />
		</div>
	);
};

export default Sidebar;
