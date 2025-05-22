import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// import { registerServiceWorker } from './lib/serviceWorkerRegistration'; // Temporarily commented out
// import { initDB } from './lib/indexedDB'; // Temporarily commented out

// Inicializa o banco de dados IndexedDB
// initDB().catch(err => { // Temporarily commented out
//   console.error('Falha ao inicializar o banco de dados IndexedDB:', err); // Temporarily commented out
// }); // Temporarily commented out

// Registra o service worker para funcionalidade offline
// if (import.meta.env.PROD) { // Temporarily commented out
//   registerServiceWorker(); // Temporarily commented out
// } else { // Temporarily commented out
//   console.log('Service Worker não registrado no ambiente de desenvolvimento'); // Temporarily commented out
// } // Temporarily commented out

// Renderizar a aplicação no DOM
createRoot(document.getElementById("root")!).render(<App />);
