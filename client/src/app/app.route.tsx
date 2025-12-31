import { Link, type RouteObject } from "react-router-dom";
import { Dashboard } from './components';
import { Login } from './modules';

export const ROUTES: RouteObject[] = [
    {
        path: '/',
        element: <div>
            <h1>This is Home Route.</h1>
            <Link to={'/dashboard'}>dashboard</Link>
            <br />
            <Link to={'/login'}>login</Link>
        </div>
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/register',
        element: <div><h1>This is User Registration Page.</h1></div>
    },
    {
        path: '/dashboard',
        element: <Dashboard />
    }
];
