
import SoMarkDown from '../../src/index.js';

describe('Caption Plugin', () => {
    let somarkdown;

    beforeEach(() => {
        somarkdown = new SoMarkDown();
    });

    describe('Table Captions', () => {
        test('should render table with top caption', () => {
            const md = `
: Table Caption

| A | B |
|---|---|
| 1 | 2 |
            `;
            const html = somarkdown.render(md);
            expect(html).toMatch(/<table>\s*<caption>Table Caption<\/caption>\s*<thead>/);
            expect(html).not.toContain('<p>: Table Caption</p>');
        });

        test('should render table with bottom caption', () => {
            const md = `
| A | B |
|---|---|
| 1 | 2 |

: Table Caption
            `;
            const html = somarkdown.render(md);
            expect(html).toMatch(/<table>\s*<caption>Table Caption<\/caption>\s*<thead>/);
            expect(html).not.toContain('<p>: Table Caption</p>');
        });

        test('should prioritize top caption over bottom caption', () => {
            const md = `
: Top Caption

| A | B |
|---|---|
| 1 | 2 |

: Bottom Caption
            `;
            const html = somarkdown.render(md);
            expect(html).toMatch(/<table>\s*<caption>Top Caption<\/caption>\s*<thead>/);
            expect(html).toContain('<p>: Bottom Caption</p>'); // Unused bottom caption remains as text
        });

        test('should allow formatting in caption', () => {
            const md = `
: Table *Caption*

| A |
|---|
| 1 |
            `;
            const html = somarkdown.render(md);
            expect(html).toContain('<caption>Table <em>Caption</em></caption>');
        });
    });

    describe('HTML Table Captions', () => {
        test('should render HTML table with top caption', () => {
            const md = `
: HTML Table Caption

<table>
  <thead>
    <tr><th>A</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td></tr>
  </tbody>
</table>
            `;
            const html = somarkdown.render(md);
            expect(html).toMatch(/<table[^>]*>\s*<caption>HTML Table Caption<\/caption>/);
            expect(html).not.toContain('<p>: HTML Table Caption</p>');
        });

        test('should allow formatting in HTML table caption', () => {
            const md = `
: HTML Table *Caption*

<table><tr><td>1</td></tr></table>
            `;
            const html = somarkdown.render(md);
            expect(html).toContain('<caption>HTML Table <em>Caption</em></caption>');
        });
    });

    describe('Figure Captions', () => {
        test('should render figure with top caption', () => {
            const md = `
: Figure Caption

![alt](img.png)
            `;
            const html = somarkdown.render(md);
            // Expected: <figure><img src="img.png" alt="alt"><figcaption>Figure Caption</figcaption></figure>
            // Note: markdown-it renders <img ...> as self-closing or not depending on strict mode/xhtml.
            // Usually <img ...>
            expect(html).toMatch(/<figure[^>]*>\s*<img src="img.png" alt="alt">\s*<figcaption>Figure Caption<\/figcaption>\s*<\/figure>/);
            expect(html).not.toContain('<p>: Figure Caption</p>');
        });

        test('should render figure with bottom caption', () => {
            const md = `
![alt](img.png)

: Figure Caption
            `;
            const html = somarkdown.render(md);
            expect(html).toMatch(/<figure[^>]*>\s*<img src="img.png" alt="alt">\s*<figcaption>Figure Caption<\/figcaption>\s*<\/figure>/);
        });

        test('should prioritize top caption for figure', () => {
            const md = `
: Top Caption

![alt](img.png)

: Bottom Caption
            `;
            const html = somarkdown.render(md);
            expect(html).toContain('<figcaption>Top Caption</figcaption>');
            expect(html).toContain('<p>: Bottom Caption</p>');
        });
    });

    describe('HTML Figure Captions', () => {
        test('should render HTML img with top caption', () => {
            const md = `
: HTML Img Caption

<img src="img.png" alt="alt">
            `;
            const html = somarkdown.render(md);
            expect(html).toMatch(/<figure>\s*<img src="img.png" alt="alt">\s*<figcaption>HTML Img Caption<\/figcaption>\s*<\/figure>/);
            expect(html).not.toContain('<p>: HTML Img Caption</p>');
        });

        test('should render HTML img with bottom caption', () => {
            const md = `
<img src="img.png" alt="alt">

: HTML Img Caption
            `;
            const html = somarkdown.render(md);
            expect(html).toMatch(/<figure>\s*<img src="img.png" alt="alt">\s*<figcaption>HTML Img Caption<\/figcaption>\s*<\/figure>/);
        });

        test('should allow formatting in HTML img caption', () => {
            const md = `
: HTML Img *Caption*

<img src="img.png" alt="alt">
            `;
            const html = somarkdown.render(md);
            expect(html).toContain('<figcaption>HTML Img <em>Caption</em></figcaption>');
        });
    });

    describe('Edge Cases', () => {
        test('should ignore non-caption paragraphs', () => {
            const md = `
Just text

| A |
|---|
| 1 |
            `;
            const html = somarkdown.render(md);
            expect(html).not.toContain('<caption>');
            expect(html).toContain('<p>Just text</p>');
        });

        test('should ignore caption if no target', () => {
            const md = `
: Lonely Caption
            `;
            const html = somarkdown.render(md);
            expect(html).toContain('<p>: Lonely Caption</p>');
        });

        test('should not treat text+image as figure', () => {
            const md = `
: Caption

Text and ![alt](img.png)
            `;
            const html = somarkdown.render(md);
            // Should be just paragraphs
            expect(html).toContain('<p>: Caption</p>');
            expect(html).toContain('<p>Text and <img');
            expect(html).not.toContain('<figure>');
        });
        
        test('should handle multiple images in one paragraph (not a figure)', () => {
             const md = `
: Caption

![a](a.png) ![b](b.png)
             `;
             const html = somarkdown.render(md);
             expect(html).not.toContain('<figure>');
             expect(html).toContain('<p>: Caption</p>');
        });

        test('should not treat text+HTML img as figure', () => {
            const md = `
: Caption

Text and <img src="img.png" alt="alt">
            `;
            const html = somarkdown.render(md);
            expect(html).toContain('<p>: Caption</p>');
            expect(html).toContain('<p>Text and <img src="img.png" alt="alt"></p>');
            expect(html).not.toContain('<figure>');
        });
    });
});
