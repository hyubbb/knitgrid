import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import { App } from './App.jsx';

const rootElement = document.getElementById('root');
const root = globalThis.__knitgridRoot ?? createRoot(rootElement);
globalThis.__knitgridRoot = root;
root.render(
  <Provider>
    <App />
  </Provider>
);
