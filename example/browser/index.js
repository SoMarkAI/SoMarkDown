document.addEventListener('DOMContentLoaded', () => {
    const SoMarkDown = window.SoMarkDown;
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const themeSelector = document.getElementById('theme-selector');
    const tocLevelInput = document.getElementById('toc-level');
    const smilesColorInput = document.getElementById('smiles-color');
    const imgFrameInput = document.getElementById('img-frame-check');
    const lineNumbersInput = document.getElementById('line-numbers-check');
    const lineNumbersNestedInput = document.getElementById('line-numbers-nested-check');

    const cssSoMarkdown = document.getElementById('css-somarkdown');
    const cssGithubLight = document.getElementById('css-github-light');
    const cssGithubDark = document.getElementById('css-github-dark');
    const cssMarkdownHere = document.getElementById('css-markdown-here');

    // Load initial content
    editor.value = window.md_string || '';

    let somarkdown;

    const update = () => {
        if (!somarkdown) return;
        const text = editor.value;
        try {
            const html = somarkdown.render(text);
            preview.innerHTML = html;
        } catch (e) {
            console.error(e);
            preview.innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
        }
    };

    const initSoMarkdown = () => {
        const tocLevel = parseInt(tocLevelInput.value, 10) || 3;
        const smilesColored = smilesColorInput.checked;
        const imgFrameEnabled = imgFrameInput.checked;
        const lineNumbersEnabled = lineNumbersInput.checked;
        const lineNumbersNested = lineNumbersNestedInput.checked;
        
        // Generate array [1, 2, ..., tocLevel]
        const includeLevel = Array.from({ length: tocLevel }, (_, i) => i + 1);

        const config = {
            html: true,
            typographer: true,
            toc: {
                includeLevel: includeLevel
            },
            smiles: {
                disableColors: !smilesColored,
            },
            imgDescEnabled: imgFrameEnabled,
            lineNumbers: {
                enable: lineNumbersEnabled,
                nested: lineNumbersNested
            }
        };

        somarkdown = new SoMarkDown(config);
        update();
    };

    const themeClassList = ['theme-light', 'theme-dark', 'theme-academic'];

    const applyThemes = () => {
        if (!themeSelector) return;
        
        const selectedValue = themeSelector.value;

        // Helper to enable one and disable others
        const setStyles = (useSoMarkdown, useGithubLight, useGithubDark, useMarkdownHere) => {
            if (cssSoMarkdown) cssSoMarkdown.disabled = !useSoMarkdown;
            if (cssGithubLight) cssGithubLight.disabled = !useGithubLight;
            if (cssGithubDark) cssGithubDark.disabled = !useGithubDark;
            if (cssMarkdownHere) cssMarkdownHere.disabled = !useMarkdownHere;
        };

        // Reset Classes and Attributes
        preview.className = '';
        preview.removeAttribute('data-theme');

        if (selectedValue.startsWith('github-')) {
            // GitHub Themes
            const mode = selectedValue.split('-')[1]; // light or dark
            if (mode === 'light') {
                setStyles(false, true, false, false);
            } else {
                setStyles(false, false, true, false);
            }
            preview.classList.add('markdown-body');
            preview.setAttribute('data-theme', mode);
        } else if (selectedValue === 'markdown-here') {
            // Markdown Here
            setStyles(false, false, false, true);
            preview.classList.add('markdown-here-wrapper');
        } else {
            // SoMarkdown Themes (default, theme-light, etc.)
            setStyles(true, false, false, false);
            preview.classList.add('somarkdown-container', 'markdown-body');
            
            if (themeClassList.includes(selectedValue)) {
                preview.classList.add(selectedValue);
            }
        }
    };

    // Event Listeners
    editor.addEventListener('input', update);

    if (themeSelector) {
        themeSelector.addEventListener('change', () => {
            applyThemes();
        });
        // Initial theme application
        applyThemes();
    }

    if (tocLevelInput) {
        tocLevelInput.addEventListener('change', initSoMarkdown);
        tocLevelInput.addEventListener('input', initSoMarkdown);
    }

    if (smilesColorInput) {
        smilesColorInput.addEventListener('change', initSoMarkdown);
    }

    if (imgFrameInput) {
        imgFrameInput.addEventListener('change', initSoMarkdown);
    }

    if (lineNumbersInput) {
        lineNumbersInput.addEventListener('change', initSoMarkdown);
    }

    if (lineNumbersNestedInput) {
        lineNumbersNestedInput.addEventListener('change', initSoMarkdown);
    }

    // Sync Scroll
    let activeSide = null;

    const syncScroll = (source, target) => {
        const sourceMaxScroll = source.scrollHeight - source.clientHeight;
        const targetMaxScroll = target.scrollHeight - target.clientHeight;
        
        if (sourceMaxScroll <= 0 || targetMaxScroll <= 0) return;

        const percentage = source.scrollTop / sourceMaxScroll;
        target.scrollTop = percentage * targetMaxScroll;
    };

    const handleScroll = (source, target, side) => {
        if (activeSide === side) {
            window.requestAnimationFrame(() => syncScroll(source, target));
        }
    };

    editor.addEventListener('mouseenter', () => { activeSide = 'editor'; });
    preview.addEventListener('mouseenter', () => { activeSide = 'preview'; });
    
    // Fallback for keyboard navigation or touch when mouse might not be involved
    editor.addEventListener('touchstart', () => { activeSide = 'editor'; }, { passive: true });
    preview.addEventListener('touchstart', () => { activeSide = 'preview'; }, { passive: true });

    editor.addEventListener('scroll', () => handleScroll(editor, preview, 'editor'));
    preview.addEventListener('scroll', () => handleScroll(preview, editor, 'preview'));

    // --- Bi-directional Sync Implementation ---

    // 1. Helpers
    const getLineStartPos = (text, line) => {
        const lines = text.split('\n');
        let pos = 0;
        for (let i = 0; i < line; i++) {
            if (i < lines.length) {
                pos += lines[i].length + 1; // +1 for newline
            }
        }
        return pos;
    };

    const getCursorLine = (textarea) => {
        const text = textarea.value;
        const pos = textarea.selectionStart;
        return text.substring(0, pos).split('\n').length - 1;
    };

    // 2. Right to Left: Double Click HTML -> Move Editor Cursor
    preview.addEventListener('dblclick', (e) => {
        // Find closest element with data-line
        const target = e.target.closest('[data-line]');
        if (target) {
            const line = parseInt(target.getAttribute('data-line'), 10);
            if (!isNaN(line)) {
                const pos = getLineStartPos(editor.value, line);
                
                editor.focus();
                editor.setSelectionRange(pos, pos);
                
                // Try to center the cursor (rudimentary approach for textarea)
                const lineHeight = parseInt(getComputedStyle(editor).lineHeight);
                const scrollPos = line * lineHeight;
                
                // Center it
                editor.scrollTop = scrollPos - (editor.clientHeight / 2);
                
                // Trigger highlight update
                syncPreviewHighlight();
            }
        }
    });

    // 3. Left to Right: Editor Cursor -> Highlight HTML
    const syncPreviewHighlight = () => {
        const line = getCursorLine(editor);
        
        // Remove previous highlights
        const prevHighlights = preview.querySelectorAll('.active-line');
        prevHighlights.forEach(el => el.classList.remove('active-line'));

        // Find element with specific data-line
        let target = preview.querySelector(`[data-line="${line}"]`);
        
        // If not found, try to find the nearest previous sibling
        if (!target) {
            const allLines = Array.from(preview.querySelectorAll('[data-line]'));
            let bestMatch = null;
            let maxLine = -1;
            
            for (const el of allLines) {
                const l = parseInt(el.getAttribute('data-line'), 10);
                if (l <= line && l > maxLine) {
                    maxLine = l;
                    bestMatch = el;
                }
            }
            target = bestMatch;
        }

        if (target) {
            target.classList.add('active-line');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Debounce for performance
    let timeout;
    const debounceSync = () => {
        clearTimeout(timeout);
        timeout = setTimeout(syncPreviewHighlight, 100);
    };

    editor.addEventListener('click', syncPreviewHighlight);
    editor.addEventListener('keyup', (e) => {
        // Only sync on navigation keys or enter
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
            syncPreviewHighlight();
        } else {
            debounceSync();
        }
    });

    // Initialize
    initSoMarkdown();
});
