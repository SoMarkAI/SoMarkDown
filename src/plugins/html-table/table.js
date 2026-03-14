const createHtmlTablePlugin = (parseTable) => (md) => {
    md.block.ruler.before('html_block', 'html_table', (state, startLine, endLine, silent) => {
        const start = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];
        const lineText = state.src.slice(start, max);

        if (!/^<table/i.test(lineText)) {
            return false;
        }

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
                nextLine++;
                break;
            }
        }

        if (!foundEnd) {
            return false;
        }

        if (silent) {
            return true;
        }

        const table = parseTable(content);
        if (!table) {
            return false;
        }

        const tokenTableOpen = state.push('table_open', 'table', 1);
        tokenTableOpen.map = [startLine, nextLine];

        Array.from(table.attributes).forEach(attr => {
            tokenTableOpen.attrs = tokenTableOpen.attrs || [];
            tokenTableOpen.attrs.push([attr.name, attr.value]);
        });

        const processRow = (tr) => {
            const trTokenOpen = state.push('tr_open', 'tr', 1);
            Array.from(tr.attributes).forEach(attr => {
                trTokenOpen.attrs = trTokenOpen.attrs || [];
                trTokenOpen.attrs.push([attr.name, attr.value]);
            });

            Array.from(tr.children).forEach(cell => {
                const tagName = cell.tagName.toLowerCase();
                if (tagName === 'td' || tagName === 'th') {
                    const cellTokenOpen = state.push(tagName + '_open', tagName, 1);

                    Array.from(cell.attributes).forEach(attr => {
                        cellTokenOpen.attrs = cellTokenOpen.attrs || [];
                        cellTokenOpen.attrs.push([attr.name, attr.value]);
                    });

                    const cellContent = cell.innerHTML;
                    const cellTokens = state.md.parse(cellContent, state.env);

                    cellTokens.forEach(t => {
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

        Array.from(table.children).forEach(child => {
            const tagName = child.tagName.toLowerCase();

            if (tagName === 'thead' || tagName === 'tbody' || tagName === 'tfoot') {
                const tokenOpen = state.push(tagName + '_open', tagName, 1);
                Array.from(child.attributes).forEach(attr => {
                    tokenOpen.attrs = tokenOpen.attrs || [];
                    tokenOpen.attrs.push([attr.name, attr.value]);
                });

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

export default createHtmlTablePlugin;
