import { StrictMode, useEffect } from 'react';
import { AppRouter } from './app.router';

export function App() {
    return (
        <StrictMode>
            <AppRouter />
        </StrictMode>
    );
}
