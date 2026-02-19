import { parseHTML } from 'linkedom'

const initDom = () => {
    try {
        // Check if document object already exists
        document;
    } catch (error) {
        const { document } = parseHTML('<!DOCTYPE html><html><body></body></html>');
        global.document = document;

        // Keep original createElement
        const originalCreateElement = document.createElement.bind(document);
        // Hijack createElement to add estimated measureText for canvas
        document.createElement = (tagName) => {
            if (tagName === 'canvas') {
                return {
                    getContext: () => ({
                        measureText: (text) => ({
                            width: text.length * 10,
                            actualBoundingBoxLeft: 0,
                            actualBoundingBoxRight: text.length * 10,
                            actualBoundingBoxAscent: 10,
                            actualBoundingBoxDescent: 0
                        }),
                        font: ''
                    })
                };
            }
            return originalCreateElement(tagName);
        };
    }
}

export default initDom
