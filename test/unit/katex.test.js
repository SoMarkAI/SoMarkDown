import { parseHTML } from 'linkedom';
import SoMarkDown from '../../src/index.js';

describe('KaTeX inside inline HTML', () => {
    let somarkdown;

    beforeEach(() => {
        somarkdown = new SoMarkDown();
    });

    const annotations = (document) => Array.from(
        document.querySelectorAll('annotation[encoding="application/x-tex"]'),
        annotation => annotation.textContent
    );

    test.each([
        ['plain Markdown', '$a>b$'],
        ['span', '<span>$a>b$</span>'],
        ['strong', '<strong>$a>b$</strong>'],
        ['span with attributes', '<span class="comparison">$a>b$</span>'],
        ['strong with attributes', '<strong data-label="comparison">$a>b$</strong>'],
        ['nested tags', '<span class="comparison"><strong>$a>b$</strong></span>'],
        ['text before math', '<span class="comparison">Compare $a>b$ now</span>']
    ])('renders math in %s', (_description, markdown) => {
        const html = somarkdown.render(markdown);
        const { document } = parseHTML(html);

        expect(document.querySelector('.katex-error')).toBeNull();
        expect(annotations(document)).toEqual(['a>b']);
    });

    test('preserves nested inline HTML, attributes and adjacent formulas', () => {
        const source = '<span class="comparison"><strong data-kind="math">$a<b$</strong></span> and $c>d$';
        const { document } = parseHTML(somarkdown.render(source));

        expect(annotations(document)).toEqual(['a<b', 'c>d']);
        expect(document.querySelector('span.comparison > strong[data-kind="math"] > .katex')).not.toBeNull();
    });

    test('does not interpret dollars in inline HTML attributes', () => {
        const source = '<span title="$x>y$" data-price="$5">$a>b$</span>';
        const { document } = parseHTML(somarkdown.render(source));
        const span = document.querySelector('span[title]');

        expect(span.getAttribute('title')).toBe('$x>y$');
        expect(span.getAttribute('data-price')).toBe('$5');
        expect(annotations(document)).toEqual(['a>b']);
    });

    test.each([
        ['inline code', '`$a>b$`'],
        ['fenced code', '```text\n$a>b$\n```']
    ])('keeps Markdown %s literal', (_description, source) => {
        const { document } = parseHTML(somarkdown.render(source));

        expect(annotations(document)).toEqual([]);
        expect(document.querySelector('code').textContent.trim()).toBe('$a>b$');
    });

    test.each(['code', 'pre', 'kbd', 'samp', 'script', 'style', 'textarea'])(
        'keeps inline HTML %s content literal and resumes math after its closing tag',
        (tagName) => {
            const source = `Text <${tagName} class="literal">$a>b$</${tagName}> then $c>d$`;
            const { document } = parseHTML(somarkdown.render(source));

            expect(annotations(document)).toEqual(['c>d']);
            expect(document.querySelector(`${tagName}.literal`).textContent).toContain('$a');
            expect(document.querySelector(`${tagName}.literal .katex`)).toBeNull();
        }
    );

    test('keeps math literal inside nested HTML code markup', () => {
        const source = '<code><span class="literal">$a>b$</span></code> $c>d$';
        const { document } = parseHTML(somarkdown.render(source));

        expect(annotations(document)).toEqual(['c>d']);
        expect(document.querySelector('code > span.literal').textContent).toBe('$a>b$');
    });
});
