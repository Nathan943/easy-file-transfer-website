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
			className="d-flex flex-column align-items-start justify-content-start p-0 border rounded-0 vh-100"
			style={{ width: "300px" }}
		>
			<div className="p-4 pb-0">
				<PairingButton
					showMenu={showMenu}
					setShowMenu={setShowMenu}
					onAddDevice={() => {
						setDeselect((prev) => prev + 1);
					}}
				/>
			</div>

			<div
				className="flex-grow-1 overflow-y-auto w-100"
				style={{ minHeight: 0 }}
			>
				<ClientList
					clients={clients}
					onSelectClient={onSelectClient}
					deselect={deselect}
					deleteClient={deleteClient}
				/>
			</div>

			<div className="m-3">
				<Name name={name} editName={editName} />
			</div>
		</div>
	);
};

export default Sidebar;
