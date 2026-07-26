import React from 'react';
import { createRoot } from 'react-dom/client';
import CockpitDemo from './cockpit-demo.jsx';
import '../../css/cockpit-demo.css';
import '../../js/pwa.js';

const root = document.getElementById('bitforward-root');

if (!root) {
  throw new Error('No se encontró el contenedor principal de BitForward.');
}

createRoot(root).render(
  <React.StrictMode>
    <CockpitDemo />
  </React.StrictMode>
);
