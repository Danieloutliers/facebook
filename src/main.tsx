import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from './lib/serviceWorkerRegistration';
import { initDB } from './lib/indexedDB';

// Inicializa o banco de dados IndexedDB
initDB().catch(err => {
  console.error('Falha ao inicializar o banco de dados IndexedDB:', err);
});

// Registra o service worker para funcionalidade offline
if (import.meta.env.PROD) {
  registerServiceWorker();
} else {
  console.log('Service Worker não registrado no ambiente de desenvolvimento');
}

// Renderizar a aplicação no DOM
createRoot(document.getElementById("root")!).render(<App />);
