import React, { useState } from "react";
import { Client } from "../types/types";

interface Props {
	clients: Client[];
	onSelectClient: (client: Client) => void;
}

const ClientList = ({ clients, onSelectClient }: Props) => {
	const [selectedIndex, setSelectedIndex] = useState(-1);

	return (
		<>
			<ul className="list-group w-100">
				{clients.map((client, index) => (
					<li
						className={
							selectedIndex == index
								? "list-group-item active"
								: "list-group-item"
						}
						onClick={() => {
							setSelectedIndex(index);
							onSelectClient(client);
						}}
						key={client.id}
					>
						{client.name}
					</li>
				))}
			</ul>
		</>
	);
};

export default ClientList;
