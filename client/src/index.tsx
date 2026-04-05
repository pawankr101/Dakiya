import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app';
import { Gaurds } from '@dakiya/shared';

function renderApp() {
    const RootElement = document.getElementById('root');
    if (Gaurds.isNull(RootElement)) {
        console.error("'Root' element not found");
    } else {
        const ROOT = createRoot(RootElement);
        ROOT.render(<App/>);
    }
}

renderApp();
