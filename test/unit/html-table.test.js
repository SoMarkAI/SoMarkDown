import { parseHTML } from 'linkedom';
import SoMarkDown from '../../src/index.js';

describe('HTML table math', () => {
    let somarkdown;

    beforeEach(() => {
        somarkdown = new SoMarkDown();
    });

    const documentFor = html => parseHTML(`<div id="result">${html}</div>`).document;
    const annotations = document => Array.from(document.querySelectorAll('annotation[encoding="application/x-tex"]'),
        node => node.textContent);

    const formulas = [
        '$a>b$',
        '$a<b$',
        '$a < b$',
        '$a<b>c$',
        '$a<td-custom>b>c$',
        '$`a>b`$',
        '$a~~~b>c$',
        String.raw`$a\&b$`,
        String.raw`$\begin{aligned}a&>b\\c&<d\end{aligned}$`,
        '$H _ 2O>H _ 2S$',
        '$Mg^{2+}>Na^+$',
        '$O^{2-}>F^-$',
        String.raw`$\mathrm{Mg}^{2+}>\mathrm{Na}^{+}$`,
        String.raw`$a\$b>c$`,
        String.raw`$\text{<em>}>0$`,
        String.raw`$\text{<code>}>0$`,
        String.raw`$a\&amp;b$`,
        '$a\nb>c$',
        '$$a>b$$',
        '$$\na<b\n$$'
    ];

    describe.each(['td', 'th'])('%s cells', tag => {
        test.each(formulas)('preserves %s exactly like math outside a table', formula => {
            const outside = documentFor(somarkdown.render(formula));
            const inside = documentFor(somarkdown.render(
                `<table><tr><${tag}>${formula}</${tag}><${tag}>neighbor</${tag}></tr></table>`));

            expect(outside.querySelectorAll('.katex-error')).toHaveLength(0);
            expect(outside.querySelectorAll('.katex')).toHaveLength(1);
            expect(inside.querySelectorAll('.katex-error')).toHaveLength(0);
            expect(inside.querySelectorAll('.katex')).toHaveLength(1);
            expect(annotations(inside)).toEqual(annotations(outside));
            expect(inside.querySelectorAll(tag)).toHaveLength(2);
            expect(inside.querySelectorAll(tag)[1].textContent.trim()).toBe('neighbor');
        });
    });

    test('renders the complete boiling point and ion charge example', () => {
        const source = '<table><tr><td>沸点：$H _ 2O>H _ 2S$</td><td>离子电荷：$Mg^{2+}>Na^+$，$O^{2-}>F^-$</td></tr></table>';
        const document = documentFor(somarkdown.render(source));
        expect(document.querySelectorAll('.katex-error')).toHaveLength(0);
        expect(document.querySelectorAll('.katex')).toHaveLength(3);
        expect(annotations(document)).toEqual(['H _ 2O>H _ 2S', 'Mg^{2+}>Na^+', 'O^{2-}>F^-']);
        expect(document.querySelectorAll('td')).toHaveLength(2);
        expect(document.querySelectorAll('td')[0].textContent).toContain('沸点：');
        expect(document.querySelectorAll('td')[1].textContent).toContain('离子电荷：');
    });

    test('retains HTML mixed with and wrapping multiple formulas', () => {
        const cell = String.raw`<strong class="label">比较：</strong>$a>b$<br><span class="formula"><strong>$\mathrm{Mg}^{2+}>\mathrm{Na}^{+}$</strong></span><em>结束</em>`;
        const document = documentFor(somarkdown.render(`<table><tr><td>${cell}</td></tr></table>`));
        expect(document.querySelectorAll('.katex-error')).toHaveLength(0);
        expect(document.querySelectorAll('td .katex')).toHaveLength(2);
        expect(document.querySelector('strong.label').textContent).toBe('比较：');
        expect(document.querySelector('span.formula > strong > .katex')).not.toBeNull();
        expect(document.querySelectorAll('td br')).toHaveLength(1);
        expect(document.querySelector('td em').textContent).toBe('结束');
        expect(annotations(document)).toEqual(annotations(documentFor(somarkdown.render(cell))));
    });

    test('does not decode ordinary text into HTML or change entity depth', () => {
        const document = documentFor(somarkdown.render(
            '<table><tr><td>&lt;em&gt;literal&lt;/em&gt; &amp;lt;tag&amp;gt; $a>b$</td></tr></table>'));
        expect(document.querySelector('td em')).toBeNull();
        expect(document.querySelector('td tag')).toBeNull();
        expect(document.querySelector('td').textContent).toContain('<em>literal</em> &lt;tag&gt;');
        expect(annotations(document)).toEqual(['a>b']);
    });

    test('does not mistake custom elements for table or literal HTML tags', () => {
        const document = documentFor(somarkdown.render(
            '<table><tr><td><code-note>$a>b$</code-note></td><td>$c<d$</td></tr></table>'));
        expect(document.querySelectorAll('td')).toHaveLength(2);
        expect(document.querySelector('code-note .katex')).not.toBeNull();
        expect(annotations(document)).toEqual(['a>b', 'c<d']);
        expect(document.querySelectorAll('.katex-error')).toHaveLength(0);
    });

    test('preserves table structure, spans, attributes and attribute dollars', () => {
        const source = '<table class="data" data-note="$literal$"><thead><tr><th colspan="2">$a>b$</th></tr></thead><tbody><tr class="row"><td rowspan="2" data-note="$a>b$">$a<b$</td><td><span title="a>b $literal$ &amp; &gt;">$a>b$</span></td></tr><tr><td>end</td></tr></tbody><tfoot><tr><td colspan="2">foot</td></tr></tfoot></table>';
        const document = documentFor(somarkdown.render(source));
        expect(document.querySelector('table.data').getAttribute('data-note')).toBe('$literal$');
        expect(document.querySelector('thead th').getAttribute('colspan')).toBe('2');
        expect(document.querySelector('tbody tr.row td').getAttribute('rowspan')).toBe('2');
        expect(document.querySelector('tbody tr.row td').getAttribute('data-note')).toBe('$a>b$');
        expect(document.querySelector('td span[title]').getAttribute('title')).toBe('a>b $literal$ & >');
        expect(document.querySelector('tfoot td').textContent.trim()).toBe('foot');
        expect(document.querySelectorAll('.katex-error')).toHaveLength(0);
        expect(annotations(document)).toEqual(['a>b', 'a<b', 'a>b']);
    });

    test('does not pair incomplete math across cell or row boundaries', () => {
        const document = documentFor(somarkdown.render(
            '<table><tr><td>$a</td><td>b$</td></tr><tr><td>$$c</td><td>d$$</td></tr><tr><td>$a>b$</td><td>end</td></tr></table>'));
        expect(document.querySelectorAll('tr')).toHaveLength(3);
        expect(document.querySelectorAll('td')).toHaveLength(6);
        expect(document.querySelector('td').textContent.trim()).toBe('$a');
        expect(document.querySelectorAll('td')[1].textContent.trim()).toBe('b$');
        expect(annotations(document)).toContain('a>b');
    });

    test.each([
        '`$` then $a>b$',
        '`` `$` `` then $a>b$',
        '\n```text\n$\n```\n\n$a>b$\n',
        '\n~~~text\n$\n~~~\n\n$a>b$\n',
        '<code>$</code> then $a>b$',
        'Text <!-- $ --> $a>b$',
        String.raw`\$literal then $a>b$`
    ])('keeps code, comments and escaped delimiters separate: %s', cell => {
        const document = documentFor(somarkdown.render(`<table><tr><td>${cell}</td></tr></table>`));
        expect(document.querySelectorAll('.katex-error')).toHaveLength(0);
        expect(annotations(document)).toEqual(['a>b']);
    });

    test.each(['SOMARKDOWNMATH0END', '&#83;OMARKDOWNMATH0END', '&#83OMARKDOWNMATH0END', '&#x53OMARKDOWNMATH0END'])(
        'does not mistake marker-like text %s for a protected formula', text => {
            const document = documentFor(somarkdown.render(
                `<table><tr><td>${text} $a>b$</td></tr></table>`));
            expect(document.querySelector('td').textContent).toContain('SOMARKDOWNMATH0END');
            expect(annotations(document)).toEqual(['a>b']);
        }
    );
});
