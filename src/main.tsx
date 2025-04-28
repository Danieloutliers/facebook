import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { LoanProvider } from "./context/LoanContext";

createRoot(document.getElementById("root")!).render(
  <LoanProvider>
    <App />
  </LoanProvider>
);
