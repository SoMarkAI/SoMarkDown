
import SoMarkDown from '../../src/index.js';

describe('Image Frame Plugin', () => {
    test('should add img-frame class by default', () => {
        const somarkdown = new SoMarkDown();
        const md = '![alt](img.png)';
        const html = somarkdown.render(md);
        expect(html).toContain('class="img-frame"');
        expect(html).toContain('data-alt="alt"');
    });

    test('should NOT add img-frame class for inline images with text', () => {
        const somarkdown = new SoMarkDown({
            imgDescEnabled: true
        });
        const md = 'Some text ![alt](img.png) more text';
        const html = somarkdown.render(md);
        expect(html).not.toContain('class="img-frame"');
        expect(html).toContain('<p>Some text <img');
    });

    test('should add img-frame class when explicitly enabled', () => {
        const somarkdown = new SoMarkDown({
            imgDescEnabled: true
        });
        const md = '![alt](img.png)';
        const html = somarkdown.render(md);
        expect(html).toContain('class="img-frame"');
    });

    test('should NOT add img-frame class when disabled', () => {
        const somarkdown = new SoMarkDown({
            imgDescEnabled: false
        });
        const md = '![alt](img.png)';
        const html = somarkdown.render(md);
        expect(html).not.toContain('class="img-frame"');
        expect(html).not.toContain('data-alt="alt"');
    });
});
