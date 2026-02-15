import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Test if React is rendering at all
console.log('main.tsx is executing');

const root = document.getElementById('root');
console.log('Root element found:', root);

if (root) {
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering React app:', error);
    // Fallback rendering
    root.innerHTML = `
      <div style="background: red; color: white; padding: 20px; margin: 20px;">
        <h1>ERROR: React failed to render</h1>
        <pre>${error}</pre>
      </div>
    `;
  }
} else {
  console.error('Root element not found!');
}
