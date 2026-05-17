import React, { useState } from "react";
import Header from "./components/Header";
import Name from "./components/Name";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";

interface Message {
  id: string;
  sender: string;
  filename: string;
  downloadUrl: string;
  timestamp: number;
}

interface Conversation {
  client: string;
  messages: Message[];
}

const App = () => {
  const clients = ["shte", "ieji", "numb"];

  const [selectedClient, setSelectedClient] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const addMessage = (client: string, message: Message) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        //Add message to conversation and return that concatenated message array
        if (conversation.client == client) {
          return {
            client: conversation.client,
            messages: [...conversation.messages, message],
          };
        }

        //If the client isnt there, return the original array
        return conversation;
      }),
    );
  };

  return (
    <div className="d-flex flex-column vh-100">
      <div className="d-flex flex-grow-1">
        <Sidebar
          clients={clients}
          onSelectClient={setSelectedClient}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
        />
        <MainContent showMenu={showMenu} onAddFile={addMessage} />
      </div>
    </div>
  );
};

export default App;
