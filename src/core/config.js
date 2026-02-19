export default {
    // Enable HTML tags in source
    html: true,

    // Use '/' to close single tags (<br />).
    // This is only for full CommonMark compatibility.
    xhtmlOut: false,

    // Convert '\n' in paragraphs into <br>
    breaks: false,

    // CSS language prefix for fenced blocks. Can be useful for external highlighters.
    langPrefix: 'language-',

    // Autoconvert URL-like text to links
    linkify: true,

    // Enable some language-neutral replacement + quotes beautification
    // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.mjs
    typographer: true,

    // Whether to display image descriptions
    imgDescEnabled: true,
    
    // Plugin specific configs
    katex: {
        throwOnError: false,
        errorColor: '#cc0000',
        enableBareBlocks: true,
        enableMathBlockInHtml: true,
        enableMathInlineInHtml: true,
        strict: 'ignore',
        trust: true
    },

    // Plugin TOC configuration
    toc: {
        includeLevel: [1, 2, 3] // Max level to include in TOC
    },

    // Plugin SmilesDrawer configuration
    smiles: {
        disableColors: false,  // Whether to disable color in SMILES rendering
        width: 150,
        height: 150
    },

    // Plugin Line Numbers configuration
    lineNumbers: {
        enable: false,  // Whether to enable line numbers
        nested: true    // Whether to enable line numbers in nested blocks
    }
};
