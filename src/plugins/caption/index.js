
const captionPlugin = (md) => {
    md.core.ruler.push('caption_plugin', (state) => {
        const tokens = state.tokens;
        const usedCaptions = new Set(); // Indices of paragraph_open tokens of used captions
        const bindings = new Map(); // Map<TargetIndex, { idx: CaptionIndex, pos: 'top'|'bottom' }>

        // Helper: Check if a token sequence is a caption paragraph
        const isCaption = (i) => {
            if (i < 0 || i + 2 >= tokens.length) return false;
            if (tokens[i].type === 'paragraph_open' && 
                tokens[i+1].type === 'inline' && 
                tokens[i+2].type === 'paragraph_close') {
                return tokens[i+1].content.startsWith(': ');
            }
            return false;
        };

        // Helper: Check if a token sequence is a Figure (paragraph with single image)
        const isFigure = (i) => {
            if (i < 0 || i + 2 >= tokens.length) return false;
            if (tokens[i].type === 'paragraph_open' && 
                tokens[i+1].type === 'inline' && 
                tokens[i+2].type === 'paragraph_close') {
                const inline = tokens[i+1];
                // Check if it contains exactly one image
                if (inline.children && inline.children.length === 1 && inline.children[0].type === 'image') {
                    return true;
                }
            }
            return false;
        };

        const isHtmlTable = (i) => {
            if (i < 0 || i >= tokens.length) return false;
            const token = tokens[i];
            if (token.type !== 'html_block') return false;
            return /^\s*<table\b/i.test(token.content || '');
        };

        const isHtmlImgBlock = (i) => {
            if (i < 0 || i >= tokens.length) return false;
            const token = tokens[i];
            if (token.type !== 'html_block') return false;
            return /^\s*<img\b/i.test(token.content || '');
        };

        const isHtmlFigure = (i) => {
            if (i < 0 || i + 2 >= tokens.length) return false;
            if (tokens[i].type === 'paragraph_open' && 
                tokens[i+1].type === 'inline' && 
                tokens[i+2].type === 'paragraph_close') {
                const inline = tokens[i+1];
                if (!inline.children || inline.children.length !== 1) return false;
                const child = inline.children[0];
                if (child.type !== 'html_inline') return false;
                return /^\s*<img\b/i.test(child.content || '');
            }
            return false;
        };

        // Pass 1: Scan for Targets and Bindings
        for (let i = 0; i < tokens.length; i++) {
            let targetType = null;
            let targetEnd = -1;

            if (tokens[i].type === 'table_open') {
                targetType = 'table';
                // Find table_close
                let balance = 1;
                for (let j = i + 1; j < tokens.length; j++) {
                    if (tokens[j].type === 'table_open') balance++;
                    else if (tokens[j].type === 'table_close') balance--;
                    
                    if (balance === 0) {
                        targetEnd = j;
                        break;
                    }
                }
            } else if (isFigure(i)) {
                targetType = 'figure';
                targetEnd = i + 2;
            } else if (isHtmlTable(i)) {
                targetType = 'html_table';
                targetEnd = i;
            } else if (isHtmlImgBlock(i)) {
                targetType = 'html_img_block';
                targetEnd = i;
            } else if (isHtmlFigure(i)) {
                targetType = 'html_figure';
                targetEnd = i + 2;
            }

            if (targetType && targetEnd !== -1) {
                let captionIdx = -1;
                let pos = null;

                // Check Top (Priority)
                // The previous block ends at i-1. If it's a paragraph, it starts at i-3.
                // We assume caption paragraph is exactly 3 tokens.
                if (i >= 3 && tokens[i-1].type === 'paragraph_close') {
                    const prevStart = i - 3;
                    if (isCaption(prevStart) && !usedCaptions.has(prevStart)) {
                        captionIdx = prevStart;
                        pos = 'top';
                    }
                }

                // Check Bottom (if no Top found)
                if (captionIdx === -1) {
                    const nextStart = targetEnd + 1;
                    if (nextStart < tokens.length && isCaption(nextStart) && !usedCaptions.has(nextStart)) {
                        captionIdx = nextStart;
                        pos = 'bottom';
                    }
                }

                if (captionIdx !== -1) {
                    if (targetType === 'html_table') {
                        const html = tokens[i].content || '';
                        if (/<caption\b/i.test(html)) continue;
                    }

                    usedCaptions.add(captionIdx);
                    bindings.set(i, { idx: captionIdx, pos, targetType });
                }
            }
            
            // Note: We continue loop normally. If we found a figure at i, we will process i+1, i+2 next.
            // But they won't be matched as targets (inline, close).
            // If we found a table, we process inside.
        }

        // Pass 2: Rebuild Tokens
        const result = [];
        for (let i = 0; i < tokens.length; i++) {
            // If this token is start of a used caption, skip the whole paragraph
            if (usedCaptions.has(i)) {
                i += 2; // Skip open, inline, close
                continue;
            }

            if (bindings.has(i)) {
                const binding = bindings.get(i);
                const captionToken = tokens[binding.idx + 1];
                
                // Process caption content
                const captionContent = captionToken.content.slice(2); // Remove ": "
                const captionInlineHtml = md.renderInline(captionContent);
                
                // Process caption children (tokens)
                let newChildren = [];
                if (captionToken.children) {
                    // Clone and adjust first child
                    newChildren = captionToken.children.map(child => {
                        const newChild = Object.assign(new state.Token(child.type, child.tag, child.nesting), child);
                        // Deep clone attrs if needed? Usually not needed for simple text adjustment
                        return newChild;
                    });
                    
                    if (newChildren.length > 0 && newChildren[0].type === 'text') {
                        if (newChildren[0].content.startsWith(': ')) {
                            newChildren[0].content = newChildren[0].content.slice(2);
                        }
                    }
                }

                const makeCaptionTokens = (tag) => {
                    const open = new state.Token(`${tag}_open`, tag, 1);
                    const close = new state.Token(`${tag}_close`, tag, -1);
                    const inline = new state.Token('inline', '', 0);
                    inline.content = captionContent;
                    inline.children = newChildren;
                    return [open, inline, close];
                };

                if (binding.targetType === 'html_table') {
                    const token = tokens[i];
                    const cloned = Object.assign(new state.Token(token.type, token.tag, token.nesting), token);
                    const html = cloned.content || '';
                    const match = html.match(/<table\b[^>]*>/i);
                    if (match) {
                        cloned.content = html.replace(match[0], `${match[0]}\n<caption>${captionInlineHtml}</caption>`);
                    }
                    result.push(cloned);
                } else if (tokens[i].type === 'table_open') {
                    // Table: Insert caption after table_open
                    result.push(tokens[i]); // table_open
                    result.push(...makeCaptionTokens('caption'));
                } else {
                    // Figure: Wrap with figure
                    const figOpen = new state.Token('figure_open', 'figure', 1);
                    // Inherit map from the original paragraph token
                    figOpen.map = tokens[i].map;
                    result.push(figOpen);
                    
                    if (binding.targetType === 'html_img_block') {
                        result.push(tokens[i]);
                    } else {
                        result.push(tokens[i+1]);
                    }
                    
                    // Caption
                    result.push(...makeCaptionTokens('figcaption'));
                    
                    const figClose = new state.Token('figure_close', 'figure', -1);
                    result.push(figClose);
                    
                    // Skip original figure paragraph tokens
                    if (binding.targetType === 'figure' || binding.targetType === 'html_figure') {
                        i += 2;
                    }
                }
            } else {
                result.push(tokens[i]);
            }
        }

        state.tokens = result;
    });
};

export default captionPlugin;
