import React from 'react';
import {callWorkerMethod} from './services';
callWorkerMethod("parseJson", [{a: "a", b: {c: ["c"]}}]);

export function App () {
    return <div className='app'>
        <span>This is App Component</span>
    </div>
}