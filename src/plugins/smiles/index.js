import Smiles from './smiles.js';
import { decodeBase64, encodeBase64 } from '../../utils/helpers.js';

/**
 * Creates a Katex macro for handling \smiles command
 * @param {object} options Options for Smiles parser
 * @returns {object} The macro function
 */
export const createSmilesMacro = () => {
    return (context) => {
        const args = context.consumeArgs(1);
        const formula = args[0].reverse().map(token => token.text).join("");
        
        // Base64 encode the SMILES string to prevent symbol conflicts
        const b64 = encodeBase64(formula);
        return `\\htmlClass{smiles-node}{\\text{${b64}}}`;
    };
};

export const postProcessSmilesHtml = (html, smiles) => {
    if (!html || !html.includes('smiles-node')) return html;
    if (!smiles) return html;

    const container = document.createElement('div');
    container.innerHTML = html;

    const nodes = container.querySelectorAll('.smiles-node');
    if (!nodes || nodes.length === 0) return html;

    nodes.forEach((el) => {
        const b64 = el.textContent;
        try {
            const smilesStr = decodeBase64(b64);
            el.outerHTML = smiles.render(smilesStr);
        } catch (e) {
            console.error('Error decoding/rendering smiles', e);
        }
    });

    return container.innerHTML;
};

export default Smiles;
