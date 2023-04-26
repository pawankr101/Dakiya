import React from 'react';
import { render } from 'react-dom';
import './index.css';
import { App } from './app';
import { callWorkerMethod } from './app/services';

render(<App/>, document.getElementById('root'));