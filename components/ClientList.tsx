import React, { useState } from "react";

interface Props {
  clients: string[];
  onSelectClient: (client: string) => void;
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
            key={client}
          >
            {client}
          </li>
        ))}
      </ul>
    </>
  );
};

export default ClientList;
