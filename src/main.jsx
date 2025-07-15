import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Global stilleri ve animasyonları içe aktar

// HTML'deki 'root' elementini bul ve React uygulamasını onun içine render et.
// React.StrictMode, geliştirme sırasında olası sorunları tespit etmeye yardımcı olan bir sarmalayıcıdır.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
