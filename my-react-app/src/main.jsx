import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Development note: Install React DevTools for better debugging experience
if (process.env.NODE_ENV === 'development') {
  console.log('💡 For better development experience, install React DevTools: https://react.dev/link/react-devtools');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
