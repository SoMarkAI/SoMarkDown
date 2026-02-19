const mdLineNumberPlugin = (md) => {
    // Save the original html_block rule if it exists
    const defaultHtmlBlockRule = md.renderer.rules.html_block || function (tokens, idx) {
        return tokens[idx].content;
    };

    // Override html_block renderer to inject data-line and class="line"
    md.renderer.rules.html_block = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const content = defaultHtmlBlockRule(tokens, idx, options, env, self);
        
        // If line mapping is disabled or no line info, return original
        if (!env || !env.lineNumbers || !token.attrs) {
            return content;
        }

        const dataLine = token.attrGet('data-line');
        if (!dataLine) {
            return content;
        }

        // Try to inject into the first tag
        const match = content.match(/<([a-zA-Z0-9-]+)([^>]*)>/);
        if (match) {
            const tagName = match[1];
            let attrs = match[2];
            const dataLineAttr = ` data-line="${dataLine}"`;
            
            // Inject class="line"
            // Check if class attribute exists (simple check)
            if (attrs.includes('class="')) {
                attrs = attrs.replace('class="', 'class="line ');
            } else if (attrs.includes("class='")) {
                attrs = attrs.replace("class='", "class='line ");
            } else {
                attrs = ` class="line"${attrs}`;
            }

            // Reconstruct the tag
            return content.replace(/<([a-zA-Z0-9-]+)([^>]*)>/, `<${tagName}${dataLineAttr}${attrs}>`);
        }
        
        return content;
    };

    // Override fence renderer to put data-line and class="line" on <pre> instead of <code>
    const defaultFenceRule = md.renderer.rules.fence || function (tokens, idx, options, env, slf) {
        // Default markdown-it fence renderer logic (simplified fallback)
        const token = tokens[idx];
        const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
        const langName = info ? info.split(/\s+/g)[0] : '';
        const highlighted = options.highlight 
            ? options.highlight(token.content, langName, '') || md.utils.escapeHtml(token.content)
            : md.utils.escapeHtml(token.content);
        
        if (highlighted.indexOf('<pre') === 0) {
            return highlighted + '\n';
        }

        if (info) {
            token.attrJoin('class', options.langPrefix + langName);
        }

        return  '<pre><code' + slf.renderAttrs(token) + '>'
                + highlighted
                + '</code></pre>\n';
    };

    md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
        // If line numbers are disabled, fall back to default
        if (!env || !env.lineNumbers) {
            return defaultFenceRule(tokens, idx, options, env, slf);
        }

        const token = tokens[idx];
        const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
        let langName = '';
        let highlighted;

        if (info) {
            langName = info.split(/\s+/g)[0];
        }

        if (options.highlight) {
            highlighted = options.highlight(token.content, langName, '') || md.utils.escapeHtml(token.content);
        } else {
            highlighted = md.utils.escapeHtml(token.content);
        }

        if (highlighted.indexOf('<pre') === 0) {
            return highlighted + '\n';
        }

        // Separate attributes:
        // 1. Language class goes to <code>
        // 2. All other attributes (data-line, class="line") go to <pre>
        
        const codeClass = langName ? `${options.langPrefix}${langName}` : '';
        
        return  '<pre' + slf.renderAttrs(token) + '><code' + (codeClass ? ` class="${codeClass}"` : '') + '>'
              + highlighted
              + '</code></pre>\n';
    };

    // Core rule to add attributes
    md.core.ruler.push('line_numbers', (state) => {
        // Check if enabled via env
        if (!state.env || !state.env.lineNumbers) {
            return;
        }

        const options = state.env.lineNumbersOptions || {};
        // Default nested to true if not specified, preserving the "fix" behavior
        const enableNested = options.nested !== false;

        state.tokens.forEach((token) => {
            if (!enableNested && token.level !== 0) {
                return;
            }

            if (token.map) {
                // Inject data-line and class="line"
                if (token.type.endsWith('_open') || 
                    token.type === 'fence' || 
                    token.type === 'html_block' ||
                    token.type === 'code_block' ||
                    token.type === 'hr' ||
                    token.type === 'math_block' ||
                    token.type === 'toc_open') {
                    
                    token.attrSet('data-line', String(token.map[0]));
                    
                    // For html_block, the renderer handles the class injection manually above
                    // For others, we can use attrJoin
                    if (token.type !== 'html_block') {
                        token.attrJoin('class', 'line');
                    }
                }
            }
        });
    });
};

export default mdLineNumberPlugin;
