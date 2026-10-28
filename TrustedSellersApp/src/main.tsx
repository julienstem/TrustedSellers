import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { FashionRepsProvider } from "./context/fashionRepsContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FashionRepsProvider>
      <App />
    </FashionRepsProvider>
  </StrictMode>,
);
