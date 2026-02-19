globalThis.md_string = `
# SoMarkDown Demo

## Image with description (For AI understaning display)
: **Figure 1:** The Stormtroopocat.

![The Stormtroopocat is sitting in the pic.](https://octodex.github.com/images/stormtroopocat.jpg)

## Tables

: **Table 1:** This is a table example in HTML syntax, only HTML format support spanning cells.

<table>
  <tr>
    <td colspan="4">
      **🚀 SoMarkDown Overview**

      Compatible with CommonMark, supporting components such as mathematics, chemistry, and code highlighting.
    </td>
  </tr>
  <tr>
    <td>
      **📦 Installation**

      \`npm install somarkdown\`
    </td>
    <td>
      **📐 Display Formula**

      $$ \\int_a^b f(x)\\,dx $$
    </td>
    <td>
      **🧪 SMILES Aspirin**

      $$\\smiles{CC(=O)OC1=CC=CC=C1C(=O)O}$$
    </td>
    <td>
      **✨ Features**

      Paragraph mapping, high-speed rendering, multiple themes.
    </td>
  </tr>
  <tr>
    <td rowspan="2">
      **🖼️ Image Example**

      ![A random example image](https://picsum.photos/250/250?random=1)
    </td>
    <td>
      **🔢 Inline Formula**

      Supports $ \\KaTeX $ and chemical extensions.
    </td>
    <td>
      **🎨 Code Highlighting**

      \`\`\`javascript
      const smd = new SoMarkDown();
      const html = smd.render(markdown)
      \`\`\`
    </td>
    <td>
      **📑 Table of Contents Generation**

      Auto-generate TOC

      **🏷️ Caption Support**

      Caption support for image and table components.
    </td>
  </tr>
  <tr>
    <td>
      **⚡ Build Command**

      \`npm run build\`
    </td>
    <td>
      **📚 Goal**

      SoMarkDown is also the output target protocol for the document intelligence parsing product [SoMark](https://somark.ai/).
    </td>
    <td>
      **🧩 Image Understanding**

      Supports the display of image understanding results.
    </td>
  </tr>
</table>

: **Table 2:** This is a table example in markdown syntax.

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

## Math
$$ E = mc^2 $$

Inline: $e^{i\\pi} + 1 = 0$

## Chemical Structure
$$ \\smiles{CC(=O)Oc1ccccc1C(=O)O} $$

SMILES syntax has been integrated into mathematical expressions, allowing them to be easily combined.

$$\\Delta G_{total} = \\underbrace{\\Delta G^{\\ominus}}_{\\text{Standard}} + RT \\ln \\left( \\frac{[\\text{ADP}] \\cdot [P_i]}{[\\smiles{C1=NC(=C2C(=N1)N(C=N2)[C@H]3[C@@H]([C@@H]([C@H](O3)COP(=O)(O)OP(=O)(O)OP(=O)(O)O)O)O)N}]} \\right) < 0$$

## Chemistry (mhchem)
$$ \\ce{CO2 + C -> 2 CO} $$

## Code
Inline \`code\`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code


Block code "fences"

\`\`\`
Sample text here...
\`\`\`

Syntax highlighting

\`\`\` js
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
\`\`\`

## Table of Contents
Use \`[[toc]]\`, but for the convenience of demonstration, it is not directly written here. You can modify and try it yourself

## Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.


## Lists

Unordered

+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
+ Sub-lists are made by indenting 2 spaces:
  - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa


1. You can use sequential numbers...
1. ...or keep all the numbers as \`1.\`

Start numbering with offset:

57. foo
1. bar

# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading


## Horizontal Rules

___

---

***


## Typographic replacements

Enable typographer option to see result.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,,  -- ---

"Smartypants, double quotes" and 'single quotes'


## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~
`.trim()
