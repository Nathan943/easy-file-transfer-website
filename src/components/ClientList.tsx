import React, { use, useEffect, useState } from "react";
import { Client } from "../types/types";
import ClientListItem from "./ClientListItem";

interface Props {
	clients: Client[];
	onSelectClient: (client: Client) => void;
	deselect: number;
	deleteClient: (client: Client) => void;
}

const ClientList = ({
	clients,
	onSelectClient,
	deselect,
	deleteClient,
}: Props) => {
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [isDeleteHovered, setIsDeleteHovered] = useState(false);
	const [isItemHovered, setIsItemHovered] = useState(false);

	useEffect(() => {
		setSelectedIndex(-1);
	}, [deselect]);

	return (
		<ul className="list-group w-100 gap-1 pe-3 border-0">
			{clients.map((client, index) => (
				<ClientListItem
					client={client}
					selected={selectedIndex == index}
					onClick={() => {
						setSelectedIndex(index);
						onSelectClient(client);
					}}
					onDelete={() => deleteClient(client)}
				/>
			))}
		</ul>
	);
};

export default ClientList;
