import SoMarkDown from '../../dist/somarkdown.js';
import '../example_data.js';


const somarkdown = new SoMarkDown({
    html: true,
    typographer: true,
});

const md_string = globalThis.md_string;
let r = somarkdown.render(md_string)

console.log(r)
