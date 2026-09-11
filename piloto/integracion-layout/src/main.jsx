import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import LayherEditor from './LayherEditor.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LayherEditor />
  </StrictMode>
);
