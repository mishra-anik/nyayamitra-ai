let socket: WebSocket | null = null;

const connectWebSocket = () => {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  socket = new WebSocket("wss://nyayamitra-ai-3202.onrender.com/ws/chat");

  return socket;
};

const getWebSocket = (): WebSocket => {
  if (!socket) {
    throw new Error("WebSocket is not connected.");
  }
    return socket;
};

const disconnectWebSocket = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
    socket = null;
  }
};

export { connectWebSocket, getWebSocket, disconnectWebSocket };
