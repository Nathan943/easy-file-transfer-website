import React from "react";
import Name from "./Name";
import ClientList from "./ClientList";
import PairingButton from "./PairingButton";

interface Props {
  clients: string[];
  onSelectClient: (client: string) => void;
  showMenu: boolean;
  setShowMenu: (showMenu: boolean) => void;
}

const Sidebar = ({ clients, onSelectClient, showMenu, setShowMenu }: Props) => {
  return (
    <div
      className="navbar flex-column align-items-start justify-content-start p-4 border rounded-0"
      style={{ width: "300px", borderRadius: "10px" }}
    >
      <PairingButton showMenu={showMenu} setShowMenu={setShowMenu} />
      <ClientList clients={clients} onSelectClient={onSelectClient} />
      <Name name="stfe" />
    </div>
  );
};

export default Sidebar;
