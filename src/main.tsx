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
// Registrar sempre para permitir testes PWA em desenvolvimento
registerServiceWorker();

// Renderizar a aplicação no DOM
createRoot(document.getElementById("root")!).render(<App />);
