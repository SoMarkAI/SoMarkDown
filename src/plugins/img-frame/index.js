
const imgFramePlugin = (md, options = {}) => {
    // Default to enabled if not specified or explicitly true
    const enabled = options.enable !== false;

    if (!enabled) return;

    md.core.ruler.push('img_frame', (state) => {
        const tokens = state.tokens;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Case 1: Standard Paragraph with Image
            if (token.type === 'paragraph_open') {
                if (i + 2 < tokens.length) {
                    const inlineToken = tokens[i + 1];
                    const closeToken = tokens[i + 2];
                    
                    if (inlineToken.type === 'inline' && closeToken.type === 'paragraph_close') {
                        const children = inlineToken.children || [];
                        const imageTokens = children.filter(t => t.type === 'image');
                        
                        if (imageTokens.length === 1 && children.length === 1) {
                            const imgToken = imageTokens[0];
                            const alt = imgToken.content || '';
                            
                            token.attrJoin('class', 'img-frame');
                            token.attrSet('data-alt', alt);
                        }
                    }
                }
            }
            // Case 2: Figure with Image (created by captionPlugin)
            else if (token.type === 'figure_open') {
                // Look ahead for the inline token containing the image
                // Structure: figure_open -> inline (image) -> ...
                if (i + 1 < tokens.length) {
                    const nextToken = tokens[i + 1];
                    if (nextToken.type === 'inline') {
                         const children = nextToken.children || [];
                         const imageTokens = children.filter(t => t.type === 'image');
                         
                         // Note: captionPlugin preserves the inline token with image
                         if (imageTokens.length === 1) {
                             const imgToken = imageTokens[0];
                             const alt = imgToken.content || '';
                             
                             token.attrJoin('class', 'img-frame');
                             token.attrSet('data-alt', alt);
                         }
                    }
                }
            }
        }
    });
};

export default imgFramePlugin;
