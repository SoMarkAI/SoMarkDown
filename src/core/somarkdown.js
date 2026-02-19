import MarkdownIt from 'markdown-it';
import markdownItSup from 'markdown-it-sup';
import markdownItSub from 'markdown-it-sub';
import markdownItMark from 'markdown-it-mark';
import defaultConfig from './config.js';
import { 
    katexPlugin, 
    tocPlugin, 
    codeHighlightPlugin,
    captionPlugin,
    imgFramePlugin,
    lineNumbersPlugin,
    htmlTablePlugin
} from '../plugins/index.js';
import initDom from '../utils/dom.js';

class SoMarkDown {
    constructor(config = {}) {
        this.config = { 
            ...defaultConfig, 
            ...config,
            // Ensure lineNumbers config is merged correctly (deep merge for this property)
            lineNumbers: {
                ...defaultConfig.lineNumbers,
                ...(config.lineNumbers || {})
            }
        };
        
        // Initialize DOM environment (needed for internal processing and Node tests)
        initDom();

        // Initialize MarkdownIt
        this.md = new MarkdownIt(this.config);

        // Register Plugins
        
        // 1. Highlight
        this.md.use(codeHighlightPlugin);

        // 2. Katex (with Smiles macro + replacement)
        this.md.use(katexPlugin, {
            ...this.config.katex,
            smiles: this.config.smiles
        });

        // 3. TOC
        this.md.use(tocPlugin, this.config.toc);

        // 4. Caption
        this.md.use(captionPlugin);

        // 5. Image Frame (Image Understanding)
        this.md.use(imgFramePlugin, { enable: this.config.imgDescEnabled });

        // 6. Sup/Sub
        this.md.use(markdownItSup);
        this.md.use(markdownItSub);
        this.md.use(markdownItMark);

        // 7. Line Numbers
        this.md.use(lineNumbersPlugin);

        // 8. HTML Table (Custom Block Parsing)
        this.md.use(htmlTablePlugin);

        // 5. Smiles handled inside the KaTeX plugin
    }

    render(src) {
        // Pass config to env for the lineNumbersPlugin
        const env = { 
            lineNumbers: this.config.lineNumbers.enable,
            lineNumbersOptions: {
                nested: this.config.lineNumbers.nested
            }
        };

        return this.md.render(src, env);
    }
}

export default SoMarkDown;
