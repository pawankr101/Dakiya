import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import { App } from './app';

const ROOT = createRoot(document.getElementById('root'));
ROOT.render(<App/>);