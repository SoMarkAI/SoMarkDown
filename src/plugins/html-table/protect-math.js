// Preserve TeX before an HTML parser can interpret '<' or serialize entities.
// The placeholders are restored only in cell content, before Markdown parsing.
const htmlTag = /^(?:<!--[\s\S]*?-->|<\/?[a-z][a-z0-9:-]*(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>)/i;
const structureTag = /^<\/?(?:table|thead|tbody|tfoot|tr|td|th)(?=[\s/>])/i;
const literalTag = /^<(code|pre|kbd|samp|script|style|textarea)(?=[\s/>])/i;

function readTag(source, pos) {
    return source[pos] === '<' ? source.slice(pos).match(htmlTag)?.[0] : undefined;
}

function isEscaped(source, pos) {
    let slashes = 0;
    while (source[--pos] === '\\') slashes++;
    return slashes % 2 === 1;
}

function codeEnd(source, start, lineStart) {
    const run = source.slice(start).match(/^(`+|~{3,})/)?.[0];
    if (!run) return start;

    const fenced = run.length >= 3 && /^[ \t]*$/.test(source.slice(lineStart, start));
    if (run[0] === '~' && !fenced) return start;

    for (let pos = start + run.length; pos < source.length;) {
        const tag = readTag(source, pos);
        if (tag && structureTag.test(tag)) return fenced ? pos : start + run.length;
        if (tag) {
            pos += tag.length;
            continue;
        }
        if (source[pos] === run[0]) {
            let end = pos + 1;
            while (source[end] === run[0]) end++;
            if (!fenced && end - pos === run.length) return end;
            if (fenced && end - pos >= run.length) {
                const prefix = source.slice(source.lastIndexOf('\n', pos - 1) + 1, pos);
                const nextLine = source.indexOf('\n', end);
                const suffix = source.slice(end, nextLine < 0 ? source.length : nextLine);
                if (/^[ \t]*$/.test(prefix) && /^[ \t]*$/.test(suffix)) return end;
            }
            pos = end;
        } else {
            pos++;
        }
    }
    return fenced ? source.length : start + run.length;
}

function mathEnd(source, start, delimiter) {
    for (let pos = start + delimiter.length; pos < source.length;) {
        const tag = readTag(source, pos);
        if (tag) {
            if (structureTag.test(tag)) return -1;
            // Attribute dollars are never closing math delimiters. A tag-like
            // TeX fragment such as a<b>c still belongs to the protected formula.
            pos += tag.length;
            continue;
        }
        // Inside math, backticks and tildes belong to TeX, not Markdown code.
        if (source.startsWith(delimiter, pos) && !isEscaped(source, pos)) {
            if (pos === start + delimiter.length || source[pos + delimiter.length] === '$') return -1;
            return pos + delimiter.length;
        }
        pos++;
    }
    return -1;
}

export default function protectTableMath(source, unescapeEntities) {
    // Only use decoded text to avoid marker collisions. It is never parsed or
    // returned: ordinary entities must keep their original HTML semantics.
    // HTML also accepts numeric references without the semicolon required by
    // Markdown's decoder; normalize those only in this collision-check copy.
    const collisionSource = unescapeEntities(source.replace(/&#(?:x[0-9a-f]+|[0-9]+);?/ig,
        reference => reference.endsWith(';') ? reference : `${reference};`));
    let prefix = 'SOMARKDOWNMATH';
    while (source.includes(prefix) || collisionSource.includes(prefix)) prefix += 'X';
    const formulas = [];
    const chunks = [];
    let cellDepth = 0;
    let lineStart = 0;
    let copied = 0;

    for (let pos = 0; pos < source.length;) {
        const tag = readTag(source, pos);
        if (tag) {
            if (/^<(?:td|th)(?=[\s/>])/i.test(tag)) cellDepth++;
            if (/^<\/(?:td|th)(?=[\s/>])/i.test(tag)) cellDepth = Math.max(0, cellDepth - 1);
            pos += tag.length;
            if (/^<(?:td|th)(?=[\s/>])/i.test(tag)) lineStart = pos;
            const literal = tag.match(literalTag);
            if (literal && !/\/>$/.test(tag)) {
                const close = new RegExp(`</${literal[1]}\\s*>`, 'ig');
                close.lastIndex = pos;
                const match = close.exec(source);
                pos = match ? close.lastIndex : source.length;
            }
            continue;
        }
        if (source[pos] === '\n') lineStart = pos + 1;
        if (cellDepth && (source[pos] === '`' || source[pos] === '~') && !isEscaped(source, pos)) {
            const end = codeEnd(source, pos, lineStart);
            if (end > pos) {
                pos = end;
                lineStart = Math.max(lineStart, source.lastIndexOf('\n', pos - 1) + 1);
                continue;
            }
        }
        if (cellDepth && source[pos] === '$' && source[pos - 1] !== '$' && source[pos - 1] !== '\\') {
            const delimiter = source[pos + 1] === '$' ? '$$' : '$';
            const end = mathEnd(source, pos, delimiter);
            if (end !== -1) {
                chunks.push(source.slice(copied, pos), `${prefix}${formulas.length}END`);
                formulas.push(source.slice(pos, end));
                pos = end;
                copied = end;
                lineStart = Math.max(lineStart, source.lastIndexOf('\n', pos - 1) + 1);
                continue;
            }
        }
        pos++;
    }
    chunks.push(source.slice(copied));

    return {
        html: chunks.join(''),
        restore: content => content.replace(new RegExp(`${prefix}(\\d+)END`, 'g'),
            (marker, index) => formulas[Number(index)] ?? marker)
    };
}
