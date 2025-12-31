import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app';

const ROOT = createRoot(document.getElementById('root'));
ROOT.render(<App/>);
