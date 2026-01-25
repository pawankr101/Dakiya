import { StrictMode, useEffect } from 'react';
import { AppRouter } from './app.router';
import { callWorkerMethod } from './services';

export function App() {
    useEffect(() => {
        callWorkerMethod('abc', ['dasas']).then(console.log).catch(console.error);
    }, []);
    return (
        <StrictMode>
            <AppRouter />
        </StrictMode>
    );
}
