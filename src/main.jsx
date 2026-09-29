import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ErrorBoundary from './ErrorBoundary.jsx';
import LayherEditor from './LayherEditor.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LayherEditor />
    </ErrorBoundary>
  </StrictMode>
);
