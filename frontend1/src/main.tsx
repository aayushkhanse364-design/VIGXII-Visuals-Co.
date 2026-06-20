import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import AdminApp from './admin/App';
import './index.css';

function isAdminRoute() {
  return window.location.pathname.startsWith('/admin');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute() ? <AdminApp /> : <App />}
    <Toaster richColors position="top-right" />
  </React.StrictMode>,
);