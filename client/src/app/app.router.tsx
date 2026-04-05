import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './app.route';

export function AppRouter() {
    return <RouterProvider router={createBrowserRouter(ROUTES)} />
}
