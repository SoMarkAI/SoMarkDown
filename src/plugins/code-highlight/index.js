import hljs from 'highlight.js';

export default function codeHighlightPlugin(md) {
  md.options.highlight = function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {
        return '';
      }
    }

    return ''; // use external default escaping
  };
}
