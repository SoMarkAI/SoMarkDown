// Copy from: https://github.com/cmaas/markdown-it-table-of-contents/blob/master/index.mjs

function slugify(text) {
	return encodeURIComponent(String(text).trim().toLowerCase().replace(/\s+/g, '-'));
}

function format(content, md) {
	return md.renderInline(content);
}

function transformContainerOpen(containerClass, containerHeaderHtml) {
	let tocOpenHtml = '<div class="' + containerClass + '">';
	if (containerHeaderHtml) {
		tocOpenHtml += containerHeaderHtml;
	}
	return tocOpenHtml;
}

function transformContainerClose(containerFooterHtml) {
	let tocFooterHtml = '';
	if (containerFooterHtml) {
		tocFooterHtml = containerFooterHtml;
	}
	return tocFooterHtml + '</div>';
}

function getTokensText(tokens) {
	return tokens
		.filter(t => ['text', 'code_inline'].includes(t.type))
		.map(t => t.content)
		.join('')
		.trim();
}

const defaultOptions = {
	includeLevel: [1, 2],
	containerClass: 'table-of-contents',
	slugify,
	markerPattern: /^\[\[toc\]\]/im,
	omitTag: '<!-- omit from toc -->',
	listType: 'ul',
	format,
	containerHeaderHtml: undefined,
	containerFooterHtml: undefined,
	transformLink: undefined,
	transformContainerOpen,
	transformContainerClose,
	getTokensText
};

function findHeadlineElements(levels, tokens, options) {
	const headings = [];
	let currentHeading = null;

	tokens.forEach((token, index) => {
		if (token.type === 'heading_open') {
			const prev = index > 0 ? tokens[index - 1] : null;
			if (prev && prev.type === 'html_block' && prev.content.trim().toLowerCase().replace('\n', '') === options.omitTag) {
				return;
			}
			const id = findExistingIdAttr(token);
			const level = parseInt(token.tag.toLowerCase().replace('h', ''), 10);
			if (levels.indexOf(level) >= 0) {
				currentHeading = {
					level: level,
					text: '',
					anchor: id || null,
					token: null
				};
			}
		}
		else if (currentHeading && token.type === 'inline') {
			const textContent = options.getTokensText(token.children, token);
			currentHeading.text = textContent;
			currentHeading.token = token;
			if (!currentHeading.anchor) {
				currentHeading.anchor = options.slugify(textContent, token);
			}
		}
		else if (token.type === 'heading_close') {
			if (currentHeading) {
				headings.push(currentHeading);
			}
			currentHeading = null;
		}
	});

	return headings;
}

function findExistingIdAttr(token) {
	if (token && token.attrs && token.attrs.length > 0) {
		const idAttr = token.attrs.find((attr) => {
			if (Array.isArray(attr) && attr.length >= 2) {
				return attr[0] === 'id';
			}
			return false;
		});
		if (idAttr && Array.isArray(idAttr) && idAttr.length >= 2) {
			const [, val] = idAttr;
			return val;
		}
	}
	return null;
}

function getMinLevel(headlineItems) {
	return Math.min(...headlineItems.map(item => item.level));
}

function addListItem(level, text, anchor, rootNode) {
	const listItem = { level, text, anchor, children: [], parent: rootNode };
	rootNode.children.push(listItem);
	return listItem;
}

function flatHeadlineItemsToNestedTree(headlineItems) {
	const toc = { level: getMinLevel(headlineItems) - 1, anchor: null, text: '', children: [], parent: null };
	let currentRootNode = toc;
	let prevListItem = currentRootNode;

	headlineItems.forEach(headlineItem => {
		if (headlineItem.level > prevListItem.level) {
			Array.from({ length: headlineItem.level - prevListItem.level }).forEach(() => {
				currentRootNode = prevListItem;
				prevListItem = addListItem(headlineItem.level, '', null, currentRootNode);
			});
			prevListItem.text = headlineItem.text;
			prevListItem.anchor = headlineItem.anchor;
		}
		else if (headlineItem.level === prevListItem.level) {
			prevListItem = addListItem(headlineItem.level, headlineItem.text, headlineItem.anchor, currentRootNode);
		}
		else if (headlineItem.level < prevListItem.level) {
			for (let i = 0; i < prevListItem.level - headlineItem.level; i++) {
				if (currentRootNode.parent) {
					currentRootNode = currentRootNode.parent;
				}
			}
			prevListItem = addListItem(headlineItem.level, headlineItem.text, headlineItem.anchor, currentRootNode);
		}
	});

	return toc;
}

function tocItemToHtml(tocItem, options, md) {
	return '<' + options.listType + '>' + tocItem.children.map(childItem => {
		let li = '<li>';
		let anchor = childItem.anchor;
		if (options && options.transformLink) {
			anchor = options.transformLink(anchor);
		}

		let text = childItem.text ? options.format(childItem.text, md, anchor) : null;

		li += anchor ? `<a href="#${anchor}">${text}</a>` : (text || '');

		return li + (childItem.children.length > 0 ? tocItemToHtml(childItem, options, md) : '') + '</li>';
	}).join('') + '</' + options.listType + '>';
}

const markdownItTableOfContents = function (md, opts) {
	const options = Object.assign({}, defaultOptions, opts);
	const tocRegexp = options.markerPattern;

	function toc(state, startLine, endLine, silent) {
		let token;
		let match;
		const start = state.bMarks[startLine] + state.tShift[startLine];
		const max = state.eMarks[startLine];

		if (state.src.charCodeAt(start) !== 0x5B /* [ */) {
			return false;
		}

		match = tocRegexp.exec(state.src.substring(start, max));
		match = !match ? [] : match.filter(function (m) { return m; });
		if (match.length < 1) {
			return false;
		}

		if (silent) {
			return true;
		}

		state.line = startLine + 1

		token = state.push('toc_open', 'toc', 1);
		token.markup = '[[toc]]';
		token.map = [startLine, state.line];

		token = state.push('toc_body', '', 0);
		token.markup = ''
		token.map = [startLine, state.line];
		token.children = [];

		token = state.push('toc_close', 'toc', -1);
		token.markup = '';

		return true;
	}

	md.renderer.rules.toc_open = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const containerClass = defaultOptions.containerClass || 'table-of-contents';
        
        // Ensure class is handled correctly
        // Check if we need to merge containerClass with existing classes (like 'line')
        const classAttr = token.attrGet('class');
        if (!classAttr) {
            token.attrSet('class', containerClass);
        } else if (!classAttr.includes(containerClass)) {
                token.attrJoin('class', containerClass);
        }
        
        const attrs = self.renderAttrs(token);
        
		let tocOpenHtml = `<div${attrs}>`;
        if (defaultOptions.containerHeaderHtml) {
            tocOpenHtml += defaultOptions.containerHeaderHtml;
        }
        return tocOpenHtml;
	};

	md.renderer.rules.toc_close = function () {
		return options.transformContainerClose(options.containerFooterHtml) + '\n';
	};

	md.renderer.rules.toc_body = function (tokens) {
		const headlineItems = findHeadlineElements(options.includeLevel, tokens, options);
		const tocTree = flatHeadlineItemsToNestedTree(headlineItems);
		const html = tocItemToHtml(tocTree, options, md);
		return html;
	};

	md.block.ruler.before('heading', 'toc', toc, {
		alt: ['paragraph', 'reference', 'blockquote']
	});
};

export default markdownItTableOfContents;
