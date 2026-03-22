import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/globals.css'

const vp = document.querySelector('meta[name="viewport"]');
if (vp) vp.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)