import React from "react";
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
}

const Sidebar = ({
	clients,
	name,
	onSelectClient,
	showMenu,
	setShowMenu,
	editName,
}: Props) => {
	return (
		<div
			className="navbar flex-column align-items-start justify-content-start p-4 border rounded-0"
			style={{ width: "250px", borderRadius: "10px" }}
		>
			<PairingButton showMenu={showMenu} setShowMenu={setShowMenu} />
			<ClientList clients={clients} onSelectClient={onSelectClient} />
			<Name name={name} editName={editName} />
		</div>
	);
};

export default Sidebar;
