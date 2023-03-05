import React from 'react';
import { createRoot } from 'react-dom/client'
import { App } from './components/App';

import './styles.less';

window.addEventListener('load', () => {
    const rootDomNode = document.getElementById("root");
    const reactRoot = createRoot(rootDomNode);
    reactRoot.render(<App/>);
});