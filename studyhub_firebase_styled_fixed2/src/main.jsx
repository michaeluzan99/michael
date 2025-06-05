import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './auth/AuthContext';
import App from './App.jsx';
ReactDOM.createRoot(document.getElementById('root')).render(<AuthProvider><App/></AuthProvider>);
