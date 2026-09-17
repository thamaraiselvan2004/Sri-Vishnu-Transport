import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {startMonthlyBusinessSummary} from './monthlyBusinessSummary';
import {PrivateAccessGate} from './components/PrivateAccessGate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivateAccessGate>
      <App />
    </PrivateAccessGate>
  </StrictMode>,
);

startMonthlyBusinessSummary();
