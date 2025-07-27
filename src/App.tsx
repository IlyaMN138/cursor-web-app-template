import { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import {
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Container,
  Box,
  Alert
} from "@mui/material";
import { io, Socket } from "socket.io-client";

// Define a type for chat messages.
interface ChatMessage {
  id: string;        // Unique identifier (could use socket id + timestamp)
  username: string;
  text: string;
  timestamp: string;
}

const AppContainer = styled(Container)`
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ChatContainer = styled(Paper)`
  width: 100%;
  max-width: 600px;
  height: 400px;
  overflow-y: auto;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const InputContainer = styled(Box)`
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
`;

const UsernameContainer = styled(Box)`
  margin-bottom: 1rem;
`;

// Helper to format timestamp
const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString();
};

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [username, setUsername] = useState("");
  const [hasUsername, setHasUsername] = useState(false);
  const [error, setError] = useState("");
  
  // Reference to chat container for auto scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Connect to Socket.IO server on component mount.
  useEffect(() => {
    // Use dynamic hostname so that it works on the local network.
    const newSocket = io(`http://${window.location.hostname}:3001`);
    
    newSocket.on("connect", () => {
      console.log("Connected to chat server");
      setError("");
    });
    
    newSocket.on("connect_error", (err: Error) => {
      console.error("Connection error:", err);
      setError("Failed to connect to the chat server.");
    });
    
    // Listen for incoming chat messages.
    newSocket.on("chat message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, { ...msg, id: newSocket.id + "-" + Date.now() }]);
    });
    
    setSocket(newSocket);
    
    // Clean up the socket connection on unmount.
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Auto scroll to bottom on new message.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message.
  const sendMessage = () => {
    if (!messageText.trim() || !socket || !hasUsername) return;
    const msg: ChatMessage = {
      id: socket.id + "-" + Date.now(),
      username: username,
      text: messageText.trim(),
      timestamp: new Date().toISOString()
    };
    // Emit message to server.
    socket.emit("chat message", msg);
    // Clear input.
    setMessageText("");
    // Optionally, you could also update messages locally (optimistic update).
  };

  // Handle username submission.
  const handleSetUsername = () => {
    if (username.trim()) {
      setHasUsername(true);
    }
  };

  return (
    <AppContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        Local Network Chat
      </Typography>

      {!hasUsername ? (
        <UsernameContainer>
          <TextField
            label="Enter your username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Box mt={1}>
            <Button variant="contained" onClick={handleSetUsername}>
              Set Username
            </Button>
          </Box>
        </UsernameContainer>
      ) : null}

      {error && (
        <Alert severity="error" sx={{ mb: 2, width: "100%", maxWidth: 600 }}>
          {error}
        </Alert>
      )}

      <ChatContainer elevation={3}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2" color="primary">
                      {msg.username}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatTimestamp(msg.timestamp)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="body1" style={{ whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </Typography>
                }
              />
            </ListItem>
          ))}
          <div ref={chatEndRef}></div>
        </List>
      </ChatContainer>

      {hasUsername && (
        <InputContainer>
          <TextField
            label="Type your message"
            variant="outlined"
            fullWidth
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </InputContainer>
      )}
    </AppContainer>
  );
}

export default App;
