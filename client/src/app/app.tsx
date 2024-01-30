import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './app.style.scss';
import { ROUTES } from './app.route';

export function App() {
    return <React.StrictMode>
        <div className='app'>
            <RouterProvider router={createBrowserRouter(ROUTES)}/>
        </div>
    </React.StrictMode>
}