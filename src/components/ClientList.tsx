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
								? "list-group-item active d-flex justify-content-between align-items-center"
								: "list-group-item d-flex justify-content-between align-items-center"
						}
						onClick={() => {
							setSelectedIndex(index);
							onSelectClient(client);
						}}
						key={client.id}
					>
						{client.name}
						<svg
							height="20"
							width="20"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								r="10"
								cx="10"
								cy="10"
								fill={client.online ? "lime" : "gray"}
							/>
						</svg>
					</li>
				))}
			</ul>
		</>
	);
};

export default ClientList;
