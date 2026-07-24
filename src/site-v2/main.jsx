import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './bitforward-app.jsx';
import '../../css/bitforward-v2.css';
import '../../js/pwa.js';

const root = document.getElementById('bitforward-root');

if (!root) {
  throw new Error('No se encontró el contenedor principal de BitForward.');
}

createRoot(root).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);
