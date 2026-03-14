import createHtmlTablePlugin from './table.js';

const htmlTablePlugin = createHtmlTablePlugin((content) => {
    if (typeof DOMParser === 'undefined') {
        return null;
    }
    const parser = new DOMParser();
    const document = parser.parseFromString(content, 'text/html');
    return document.querySelector('table');
});

export default htmlTablePlugin;
