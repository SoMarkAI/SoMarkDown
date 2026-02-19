import SmilesDrawer from 'smiles-drawer';
import initDom from '../../utils/dom.js';

const parseViewBoxSize = (viewBox) => {
    if (!viewBox) return null;
    const parts = viewBox.trim().split(/[\s,]+/).map((v) => Number.parseFloat(v));
    if (parts.length !== 4) return null;
    const width = parts[2];
    const height = parts[3];
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
    return { width, height };
};

const setFontSize = (fontSize, options) => {
    if (!fontSize) {
        return options;
    }
    const pt = Number(fontSize) * 3 / 4;
    const scale = pt / 5;
    options.bondThickness = 0.6 * scale;
    options.bondLength = 15 * scale;
    options.bondSpacing = 0.18 * 15 * scale;
    options.fontSizeLarge = pt;
    options.fontSizeLargePx = fontSize;
    options.fontSizeSmall = 3 * scale;
    options.fontSizeSmallPx = (3 * scale) * 4 / 3;
    options.padding = 5 * scale;

    return options;
};

const setDisableColors = (options, darkTextColor, lightTextColor) => {
    options.themes = {
        dark: {
            C: darkTextColor,
            O: darkTextColor,
            N: darkTextColor,
            F: darkTextColor,
            CL: darkTextColor,
            BR: darkTextColor,
            I: darkTextColor,
            P: darkTextColor,
            S: darkTextColor,
            B: darkTextColor,
            SI: darkTextColor,
            H: darkTextColor,
            BACKGROUND: '#141414'
        },
        light: {
            C: lightTextColor,
            O: lightTextColor,
            N: lightTextColor,
            F: lightTextColor,
            CL: lightTextColor,
            BR: lightTextColor,
            I: lightTextColor,
            P: lightTextColor,
            S: lightTextColor,
            B: lightTextColor,
            SI: lightTextColor,
            H: lightTextColor,
            BACKGROUND: '#fff'
        }
    };
    return options;
};

const setThemesByDefault = (options, darkTextColor, lightTextColor) => {
    options.themes = {
        dark: {
            C: darkTextColor,
            O: '#e74c3c',
            N: '#3498db',
            F: '#27ae60',
            CL: '#16a085',
            BR: '#d35400',
            I: '#8e44ad',
            P: '#d35400',
            S: '#f1c40f',
            B: '#e67e22',
            SI: '#e67e22',
            H: darkTextColor,
            BACKGROUND: '#141414'
        },
        light: {
            C: lightTextColor,
            O: '#e74c3c',
            N: '#3498db',
            F: '#27ae60',
            CL: '#16a085',
            BR: '#d35400',
            I: '#8e44ad',
            P: '#d35400',
            S: '#f1c40f',
            B: '#e67e22',
            SI: '#e67e22',
            H: lightTextColor,
            BACKGROUND: '#fff'
        }
    };
    return options;
};

class Smiles {
    constructor(options = {}) {
        initDom();

        this.width = options.width || 150;
        this.height = options.height || 150;
        this.maxSizePx = options.maxSizePx || 150;
        this.theme = options.theme || 'light';
        this.stretch = Boolean(options.stretch);

        let drawerOptions = {
            width: this.width,
            height: this.height,
            ...(options.drawerOptions || {})
        };

        if (options.fontSize) {
            drawerOptions = setFontSize(options.fontSize, drawerOptions);
        }

        const cssTextColor = 'var(--somarkdown-smiles-color-text, currentColor)';
        const darkTextColor = options.darkTextColor || cssTextColor;
        const lightTextColor = options.lightTextColor || cssTextColor;

        if (options.disableColors) {
            drawerOptions = setDisableColors(drawerOptions, darkTextColor, lightTextColor);
        } else {
            drawerOptions = setThemesByDefault(drawerOptions, darkTextColor, lightTextColor);
        }

        this.svgDrawer = new SmilesDrawer.SvgDrawer(drawerOptions);
    }

    render(smiles, renderOptions = {}) {
        if (!smiles) {
            return '';
        }

        const theme = renderOptions?.theme || this.theme;
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        let svgString = '';
        let parseError = null;
        let finalWidth = null;
        let finalHeight = null;

        SmilesDrawer.parse(smiles, (tree) => {
            this.svgDrawer.draw(tree, svgElement, theme, null, false);

            let width = null;
            let height = null;

            const wrapper = this.svgDrawer.svgWrapper;
            if (wrapper && Number.isFinite(wrapper.drawingWidth) && Number.isFinite(wrapper.drawingHeight)) {
                if (wrapper.drawingWidth > 0) width = wrapper.drawingWidth;
                if (wrapper.drawingHeight > 0) height = wrapper.drawingHeight;
            }

            if (!width || !height) {
                const attrW = Number.parseFloat(svgElement.getAttribute('width') || '');
                const attrH = Number.parseFloat(svgElement.getAttribute('height') || '');
                if (!width && Number.isFinite(attrW) && attrW > 0) width = attrW;
                if (!height && Number.isFinite(attrH) && attrH > 0) height = attrH;
            }

            if (!width || !height) {
                const vb = parseViewBoxSize(svgElement.getAttribute('viewBox'));
                if (vb) {
                    if (!width) width = vb.width;
                    if (!height) height = vb.height;
                }
            }

            if (!width) width = this.width;
            if (!height) height = this.height;

            let scale = 1;
            if (!this.stretch && this.maxSizePx) {
                const next = this.maxSizePx / Math.max(width, height);
                if (Number.isFinite(next) && next > 0) {
                    scale = Math.min(1, next);
                }
            }

            finalWidth = Math.max(1, Math.round(width * scale));
            finalHeight = Math.max(1, Math.round(height * scale));

            svgElement.style.width = `${finalWidth}px`;
            svgElement.style.height = `${finalHeight}px`;
            svgElement.setAttribute('width', `${finalWidth}`);
            svgElement.setAttribute('height', `${finalHeight}`);
            svgElement.style.display = 'block';
            svgElement.style.overflow = 'visible';
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svgString = svgElement.outerHTML;
        }, (err) => {
            parseError = err;
            console.error('[SmilesDrawer Error]' + err);
            svgString = `<span style="background-color: yellow; color:red">[SyntaxError Error for: ${smiles}] ${err}</span>`;
        });

        if (parseError) {
            return svgString;
        }

        const wrapperSizeStyle = (finalWidth && finalHeight)
            ? `width:${finalWidth}px; height:${finalHeight}px;`
            : `width:${this.width}px; height:${this.height}px;`;

        return `<span style="display:inline-block; vertical-align: middle; line-height:0; overflow: visible; ${wrapperSizeStyle}">${svgString}</span>`;
    }
}

export default Smiles;
