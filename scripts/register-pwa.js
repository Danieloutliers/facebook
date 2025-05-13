// Este script deve ser executado durante o build para garantir que o PWA seja registrado corretamente
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Verificando configuração do PWA...');

// Verificar se o manifesto existe
const manifestPath = path.join(process.cwd(), 'public/manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Manifesto não encontrado:', manifestPath);
  process.exit(1);
}

// Verificar se o service worker existe
const serviceWorkerPath = path.join(process.cwd(), 'public/service-worker.js');
if (!fs.existsSync(serviceWorkerPath)) {
  console.error('Service Worker não encontrado:', serviceWorkerPath);
  process.exit(1);
}

// Verificar se index.html tem as referências ao manifesto e metatags PWA
const indexPath = path.join(process.cwd(), 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

const requiredTags = [
  '<link rel="manifest"',
  '<meta name="theme-color"',
  '<link rel="apple-touch-icon"',
];

const missingTags = requiredTags.filter(tag => !indexContent.includes(tag));

if (missingTags.length > 0) {
  console.warn('Atenção: Tags PWA ausentes no index.html:');
  missingTags.forEach(tag => console.warn(`- ${tag}`));
  console.warn('Por favor, adicione estas tags ao index.html para garantir a funcionalidade PWA.');
} else {
  console.log('Configuração PWA verificada: OK');
}

// Verificar ícones
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const missingIcons = [];

for (const size of iconSizes) {
  const iconPath = path.join(process.cwd(), `public/icons/icon-${size}x${size}.png`);
  if (!fs.existsSync(iconPath)) {
    missingIcons.push(`icon-${size}x${size}.png`);
  }
}

if (missingIcons.length > 0) {
  console.warn('Atenção: Ícones ausentes:');
  missingIcons.forEach(icon => console.warn(`- ${icon}`));
  console.warn('Execute o script generate-icons.js para criar estes ícones.');
} else {
  console.log('Ícones verificados: OK');
}

// Tudo verificado
console.log('Verificação do PWA concluída com sucesso!');
