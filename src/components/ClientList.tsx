import React, { useEffect, useState } from "react";
import { Client } from "../types/types";

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

	useEffect(() => {
		setSelectedIndex(-1);
	}, [deselect]);

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

						<div>
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

							<button
								className="border-0 m-0 bg-transparent ps-2 pe-0"
								style={{ lineHeight: 0 }}
								onClick={() => deleteClient(client)}
							>
								<img
									src="../src/icons/delete.png"
									style={{
										width: "20px",
									}}
								/>
							</button>
						</div>
					</li>
				))}
			</ul>
		</>
	);
};

export default ClientList;
