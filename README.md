# SoMarkDown

[![NPM version](https://img.shields.io/npm/v/somarkdown.svg?style=flat)](https://www.npmjs.org/package/somarkdown)
[![GitHub](https://img.shields.io/github/license/SoMarkAI/SoMarkDown)](https://github.com/SoMarkAI/SoMarkDown/blob/master/LICENSE)

SoMarkDown is a Markdown superset built upon [markdown-it](https://github.com/markdown-it/markdown-it), providing enhanced support for professional rendering capabilities including mathematical formulas, chemical structures (SMILES), code syntax highlighting, and more.

SoMarkDown was established with the dual objective of delivering a powerful and flexible Markdown rendering solution for professional users while providing LLMs with a concise, unambiguous, and easily parsable Markdown standard. SoMarkDown also serves as the target protocol for parsing results in the [SoMark](https://somark.ai/) document intelligence parsing product.

**🧬 Key Features:**
- **Markdown Superset**: Compliant with CommonMark specification, fully compatible with standard Markdown.
- **Paragraph Mapping**: Automatic injection of line number attributes, enabling essential functionalities like synchronized scrolling and mapping navigation similar to VSCode's Markdown implementation.
- **High-Speed Rendering**: Optimized based on markdown-it, delivering fast rendering performance with support for large document processing.
- **Multiple Themes**: Built-in support for various themes (light, dark, academic style).
- **Universal Compatibility**: Supports both browser and Node.js server-side rendering.

**✨ Specialized Components:**
- **📐 Mathematical Formulas**: Integrated [KaTeX](https://katex.org/) support for LaTeX mathematical expressions, including `mhchem` chemical equation extensions.
- **🧪 Chemical Structures**: Integrated [SmilesDrawer](https://github.com/reymond-group/smilesDrawer) for rendering SMILES strings. Innovatively supports syntax merging between LaTeX and SMILES, significantly expanding chemical structure expression capabilities.
- **🎨 Code Syntax Highlighting**: Automatic detection and highlighting of code blocks through [highlight.js](https://highlightjs.org/).
- **📑 Table of Contents Generation**: Automatic generation of table of contents (TOC).
- **🖼️ Image Understanding**: Support for image comprehension and display.
- **🏷️ Caption Support**: Support for figure and table caption expressions.

## Installation

Install via npm:

```bash
npm install somarkdown
```

For browser usage, include via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/somarkdown/dist/somarkdown.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/somarkdown/dist/somarkdown.css">
```

Build from source:

```bash
git clone https://github.com/SoMarkAI/SoMarkDown.git
cd somarkdown
npm install
npm run build
```

## Usage

### Basic Usage

> The project includes a browser example in `example/browser`. After compilation, you can directly open `example/browser/index.html` to view the demonstration.

Usage example in code:

```javascript
import SoMarkDown from 'somarkdown';
import 'somarkdown/dist/somarkdown.css'; // Import base styles

const somarkdown = new SoMarkDown({
  lineNumbers: {
    enable: true
  }
});

const markdown = `
# SoMarkDown Demo

## Math
$$ E = mc^2 $$

Inline: $e^{i\\pi} + 1 = 0$

## Chemical Structure
$$\\smiles{CC(=O)Oc1ccccc1C(=O)O}$$

## Chemistry (mhchem)
$$ \\ce{CO2 + C -> 2 CO} $$
`;

const html = somarkdown.render(markdown);
console.log(html);
```

### Configuration

You can pass a configuration object to the constructor:

```javascript
const config = {
  linkify: true,     // Automatically convert URL-like text to links
  typographer: true, // Enable language-neutral replacements + quotes beautification
  
  // Core functionality configuration
  imgDescEnabled: true, // Whether to display image descriptions
  lineNumbers: {
    enable: true,    // Enable source code line number injection (for bidirectional synchronization)
    nested: true     // Whether to inject line numbers for nested blocks (list items, quotes, etc.)
  },

  // Plugin configuration
  katex: {
    throwOnError: false,
    errorColor: '#cc0000'
  },
  toc: {
    includeLevel: [1, 2, 3]  // Heading levels to include in TOC
  },
  smiles: {
    disableColors: false,  // Whether to disable colors in SMILES rendering
    width: 300,
    height: 200
  }
};

const somarkdown = new SoMarkDown(config);
```

Full configuration options are available in `src/core/config.js`.

## Themes

SoMarkDown includes built-in themes that can be imported via `somarkdown.css`. Apply theme classes to containers:
- `theme-light`: Light theme (default), suitable for general reading.
- `theme-dark`: Dark theme designed for low-light environments, featuring deep colors and high contrast.
- `theme-academic`: Academic-style theme optimized for research papers, with strong color contrast and larger fonts.

## API Reference

### `new SoMarkDown(config)`

Creates a new instance.

### `render(src: string): string`

Renders Markdown source code to HTML string.

## License

MIT