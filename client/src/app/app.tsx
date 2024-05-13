import React, { useEffect } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './app.route';
import { callWorkerMethod } from './services';

export function App() {
    useEffect(() => {
        callWorkerMethod('abc', ['dasas']).then(console.log).catch(console.error);
    }, []);
    return <React.StrictMode>
        <div>
            <RouterProvider router={createBrowserRouter(ROUTES)}/>
        </div>
    </React.StrictMode>
}