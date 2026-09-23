import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./Redux/Store.js";
// In development, Vite securely proxies API and Socket.IO requests to the
// local backend. This gives phones one HTTPS origin, which is required for
// microphone and camera access. Production should set VITE_SERVER_URL.
export const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>,
);
