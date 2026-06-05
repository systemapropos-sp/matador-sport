import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { ModalProvider } from "./components/modals/ModalContext";
import ModalManager from "./components/modals/ModalManager";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ModalProvider>
        <App />
        <ModalManager />
      </ModalProvider>
    </ThemeProvider>
  </StrictMode>
);
