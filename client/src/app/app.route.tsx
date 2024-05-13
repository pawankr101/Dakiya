import React from 'react';
import { Link, RouteObject } from "react-router-dom";
import { Dashboard } from './components';
import { Login } from './modules';

export const ROUTES: RouteObject[] = [
    {
        path: '/',
        element: <div>
            <h1>This is Home Route.</h1>
            <Link to={'/login'}></Link>
        </div>
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/dashboard',
        element: <Dashboard />
    }
];