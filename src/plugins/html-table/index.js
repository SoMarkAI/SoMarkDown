import { parseHTML } from 'linkedom';

const htmlTablePlugin = (md) => {
    // Register a new block rule before 'html_block'
    md.block.ruler.before('html_block', 'html_table', (state, startLine, endLine, silent) => {
        const start = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];
        const lineText = state.src.slice(start, max);

        // 1. Intercept Logic: Check if line starts with <table (case insensitive)
        if (!/^<table/i.test(lineText)) {
            return false;
        }

        // Search for end of table </table>
        let nextLine = startLine;
        let foundEnd = false;
        let content = '';

        for (; nextLine < endLine; nextLine++) {
            const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
            const lineEnd = state.eMarks[nextLine];
            const line = state.src.slice(lineStart, lineEnd);
            content += line + '\n';
            
            if (/<\/table>/i.test(line)) {
                foundEnd = true;
                nextLine++; // Move past the closing line
                break;
            }
        }

        if (!foundEnd) {
            return false;
        }

        if (silent) {
            return true;
        }

        // Parse the extracted HTML string
        const { document } = parseHTML(content);
        const table = document.querySelector('table');
        
        if (!table) return false;

        // 5. Token Construction
        const tokenTableOpen = state.push('table_open', 'table', 1);
        tokenTableOpen.map = [startLine, nextLine];
        
        // Preserve table attributes
        Array.from(table.attributes).forEach(attr => {
            tokenTableOpen.attrs = tokenTableOpen.attrs || [];
            tokenTableOpen.attrs.push([attr.name, attr.value]);
        });

        // Helper to process a row (TR)
        const processRow = (tr) => {
            const trTokenOpen = state.push('tr_open', 'tr', 1);
            // Preserve TR attributes
            Array.from(tr.attributes).forEach(attr => {
                trTokenOpen.attrs = trTokenOpen.attrs || [];
                trTokenOpen.attrs.push([attr.name, attr.value]);
            });

            Array.from(tr.children).forEach(cell => {
                const tagName = cell.tagName.toLowerCase();
                if (tagName === 'td' || tagName === 'th') {
                    const cellTokenOpen = state.push(tagName + '_open', tagName, 1);
                    
                    // 3. Attribute Extraction (colspan, rowspan, etc.)
                    Array.from(cell.attributes).forEach(attr => {
                        cellTokenOpen.attrs = cellTokenOpen.attrs || [];
                        cellTokenOpen.attrs.push([attr.name, attr.value]);
                    });

                    // 4. Recursive Parsing
                    // Use markdown-it's parse logic for cell content
                    const cellContent = cell.innerHTML;
                    
                    // We need to trim whitespace to avoid extra paragraphs if user just indented code
                    // But markdown indentation is significant...
                    // HTML parsing of innerHTML might strip some formatting or keep it.
                    // Let's pass it as is.
                    const cellTokens = state.md.parse(cellContent, state.env);
                    
                    // Append generated tokens to current stream
                    cellTokens.forEach(t => {
                        // If we have an inline token, we need to clear its content
                        // because the main parser's inline rule will run on this token again.
                        // Since we already parsed it (and populated children), 
                        // clearing content prevents duplication (appending children again).
                        if (t.type === 'inline') {
                            t.content = '';
                        }
                        state.tokens.push(t);
                    });
                    
                    state.push(tagName + '_close', tagName, -1);
                }
            });

            state.push('tr_close', 'tr', -1);
        };

        // Traverse table children
        Array.from(table.children).forEach(child => {
            const tagName = child.tagName.toLowerCase();
            
            if (tagName === 'thead' || tagName === 'tbody' || tagName === 'tfoot') {
                const tokenOpen = state.push(tagName + '_open', tagName, 1);
                Array.from(child.attributes).forEach(attr => {
                    tokenOpen.attrs = tokenOpen.attrs || [];
                    tokenOpen.attrs.push([attr.name, attr.value]);
                });

                // Process rows inside
                Array.from(child.children).forEach(grandChild => {
                    if (grandChild.tagName === 'TR') {
                        processRow(grandChild);
                    }
                });

                state.push(tagName + '_close', tagName, -1);
            } else if (tagName === 'tr') {
                processRow(child);
            }
        });

        state.push('table_close', 'table', -1);

        state.line = nextLine;
        return true;
    });
};

export default htmlTablePlugin;
