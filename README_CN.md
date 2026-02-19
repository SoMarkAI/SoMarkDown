# SoMarkDown

[![NPM version](https://img.shields.io/npm/v/somarkdown.svg?style=flat)](https://www.npmjs.org/package/somarkdown)
[![GitHub](https://img.shields.io/github/license/SoMarkAI/SoMarkDown)](https://github.com/SoMarkAI/SoMarkDown/blob/master/LICENSE)

SoMarkDown是Markdown的超集，基于[markdown-it](https://github.com/markdown-it/markdown-it)开发，添加了对专业渲染方案的支持，如数学公式、化学结构式（SMILES）、代码语法高亮等。

SoMarkDown 的创立目标是为了给专业用户提供一个强大而灵活的 Markdown 渲染解决方案的同时，为 LLM 提供一个简洁、无歧义、易解析的 Markdown 标准。SoMarkDown 也是 [SoMark](https://somark.ai/) 文档智能解析产品的解析结果目标协议。

**🧬 特性：**
- **Markdown 超集**: 遵从 CommonMark 规范，完全兼容标准 Markdown。
- **段落映射**: 自动注入行号属性，实现类似VSCode中Markdown的同步滚动和映射跳转必须。
- **高速渲染**: 基于 markdown-it 优化，渲染速度快，支持大文档渲染。
- **多主题**: 内置多种主题支持（亮色、暗色、学术风格）。
- **通用性**: 支持浏览器和 Node 服务端渲染。

**✨ 特色组件：**
- **📐 数学公式**: 集成 [KaTeX](https://katex.org/) 支持 LaTeX 数学公式，包含 `mhchem` 化学方程式扩展。
- **🧪 化学结构**: 集成 [SmilesDrawer](https://github.com/reymond-group/smilesDrawer) 渲染 SMILES 字符串。并创新支持 Latex 和 SMILES 的语法合并，极大扩展了化学结构式的表达能力。
- **🎨 代码高亮**: 通过 [highlight.js](https://highlightjs.org/) 自动检测并高亮代码块。
- **📑 目录生成**: 自动生成目录 (TOC)。
- **🖼️ 图片理解**: 对于图片支持图片理解的展示。
- **🏷️ Caption**: 支持图和表的 Caption 的表达。

## 安装

通过 npm 安装：

```bash
npm install somarkdown
```

如果在浏览器中引用，可以通过 CDN 引入：

```html
<script src="https://cdn.jsdelivr.net/npm/somarkdown/dist/somarkdown.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/somarkdown/dist/somarkdown.css">
```

从源码编译：

```bash
git clone https://github.com/SoMarkAI/SoMarkDown.git
cd somarkdown
npm install
npm run build
```

## 使用方法

### 基本用法

> 项目的`example/browser`中提供了一个浏览器示例，在编译后可以直接打开`example/browser/index.html`查看效果。

在代码中的使用示例：

```javascript
import SoMarkDown from 'somarkdown';
import 'somarkdown/dist/somarkdown.css'; // 引入基础样式

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

### 配置

你可以向构造函数传递配置对象：

```javascript
const config = {
  linkify: true,     // 自动将类似 URL 的文本转换为链接
  typographer: true, // 启用一些语言中立的替换 + 引号美化
  
  // 核心功能配置
  imgDescEnabled: true, // 是否显示图片描述
  lineNumbers: {
    enable: true,    // 启用源码行号注入（用于双向同步）
    nested: true     // 是否为嵌套块（如列表项、引用）注入行号
  },

  // 插件配置
  katex: {
    throwOnError: false,
    errorColor: '#cc0000'
  },
  toc: {
    includeLevel: [1, 2, 3]  // 要包含在 TOC 中的标题级别
  },
  smiles: {
    disableColors: false,  // 是否禁用 SMILES 渲染中的颜色
    width: 300,
    height: 200
  }
};

const somarkdown = new SoMarkDown(config);
```

完整的config配置请参考 `src/core/config.js`

## 主题

SoMarkDown 自带内置主题，可以通过`somarkdown.css`引入，并在容器class上添加`theme-light`、`theme-dark`、`theme-academic`来切换主题：
1. 亮色主题 (light)：默认主题，适用于一般阅读。
2. 暗色主题 (dark)：专为低光照环境设计，颜色深，对比度高。
3. 学术风格主题 (academic)：专为学术论文设计，颜色对比强，字体大。

## API 参考

### `new SoMarkDown(config)`

创建一个新实例。

### `render(src: string): string`

将 Markdown 源码渲染为 HTML 字符串。

## 许可证

MIT
