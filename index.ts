import Vue from "vue";
import Component from "vue-class-component";
import * as MarkdownIt from "markdown-it";
import * as hljs from "highlight.js";
import "tree-component/vue";
import { indexTemplateHtml } from "./variables";
import { EventData, TreeData, DropPosition } from "tree-component/vue";

const md = MarkdownIt({
    linkify: true,
    highlight: (str: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return `<pre><code class="hljs ${lang}">${hljs.highlight(lang, str).value}</code></pre>`;
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
            }
        } else {
            try {
                return `<pre><code class="hljs">${hljs.highlightAuto(str).value}</code></pre>`;
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
            }
        }
        return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
    },
});
md.renderer.rules.heading_open = (tokens: MarkdownIt.Token[], index: number, options: any, env: any, self: MarkdownIt.Renderer) => {
    const token = tokens[index];
    for (const header of headers) {
        if (header.tokenIndex === index) {
            return `<${token.tag} id="${header.id}">`;
        }
    }
    return `<${token.tag}>`;
};

let content = "";
const headers: Header[] = [];
const toc: TreeData<Header>[] = [];

const enum PositionState {
    top,
    borderTop,
    middle,
    down,
}

function setSelectionOfTree(tree: TreeData<Header>, height: number, state: PositionState): PositionState {
    if (tree.children) {
        for (let i = tree.children.length - 1; i >= 0; i--) {
            state = setSelectionOfTree(tree.children[i], height, state);
        }
    }
    const headerElement = document.getElementById(tree.value!.id);
    if (headerElement) {
        const top = headerElement.getBoundingClientRect().top;
        if (top < 0) {
            tree.state.selected = state === PositionState.middle || state === PositionState.down;
            state = PositionState.top;
        } else if (top >= height) {
            tree.state.selected = false;
            state = PositionState.down;
        } else if (top < 5) {
            tree.state.selected = true;
            state = PositionState.borderTop;
        } else {
            tree.state.selected = true;
            state = PositionState.middle;
        }
    }
    return state;
}

@Component({
    template: indexTemplateHtml,
})
class App extends Vue {
    content = content;
    toc = toc;
    isNavExpand = false;

    mounted() {
        document.onscroll = ev => {
            this.setSelectionOfTrees();
        };
        this.setSelectionOfTrees();

        window.onhashchange = ev => {
            if (ev.newURL) {
                const hashIndex = ev.newURL.indexOf("#");
                if (hashIndex >= 0) {
                    this.navigateToHash(ev.newURL.substring(hashIndex));
                }
            }
        };

        if (location.hash) {
            this.navigateToHash(location.hash);
        }
    }

    get tocClass() {
        return this.isNavExpand ? "toc toc-expand" : "toc";
    }
    get contentClass() {
        return this.isNavExpand ? "content content-expand" : "content";
    }
    get navClass() {
        return this.isNavExpand ? "nav content-expand" : "nav";
    }

    setSelectionOfTrees() {
        const height = window.innerHeight || document.documentElement.clientHeight;

        let state = PositionState.down;
        for (let i = this.toc.length - 1; i >= 0; i--) {
            state = setSelectionOfTree(this.toc[i], height, state);
        }
    }
    toggle(eventData: EventData<Header>) {
        eventData.data.state.opened = !eventData.data.state.opened;
    }
    change(eventData: EventData<Header>) {
        location.hash = eventData.data.value!.hash;
    }
    navigateToHash(hash: string) {
        if (hash) {
            for (const header of headers) {
                if (header.hash === hash) {
                    const headerElement = document.getElementById(header.id);
                    if (headerElement) {
                        document.body.scrollTop += headerElement.getBoundingClientRect().top;
                    }
                    return;
                }
            }
        }
    }
    toggleNavigation() {
        this.isNavExpand = !this.isNavExpand;
    }
}

function endsWith(target: string, sub: string) {
    return target.lastIndexOf(sub) + sub.length === target.length;
}

let src = "./README.md";
if (location.pathname) {
    if (endsWith(location.pathname, ".html")
        && !endsWith(location.pathname, "/index.html")) {
        src = location.pathname.substring(0, location.pathname.lastIndexOf(".html")) + ".md";
    }
}
if (location.search) {
    const array = location.search.substring(1).split("&");
    for (const item of array) {
        if (item.indexOf("src=") === 0) {
            const srcFromQuery = item.substring("src=".length);
            if (srcFromQuery) {
                src = srcFromQuery;
            }
            break;
        }
    }
}

const request = new XMLHttpRequest();
request.onreadystatechange = () => {
    if (request.readyState === XMLHttpRequest.DONE) {
        let responseText: string;
        if (request.status >= 400) {
            responseText = `# ${request.status}

${request.statusText} for getting src: ${src}
`;
        } else {
            responseText = request.responseText;
        }
        const tokens = md.parse(responseText, {});
        for (let i = 0; i + 2 < tokens.length; i++) {
            if (tokens[i].type === "heading_open" && tokens[i + 2].type === "heading_close") {
                const headerContent = tokens[i + 1].content;
                let index = 0;
                for (let j = headers.length - 1; j >= 0; j--) {
                    const header = headers[j];
                    if (header.content === headerContent) {
                        index = header.index + 1;
                        break;
                    }
                }
                const base = normalizeId(headerContent) + (index ? "_" + index : "");
                headers.push({
                    tokenIndex: i,
                    tag: tokens[i].tag,
                    content: headerContent,
                    index,
                    id: "header_" + base,
                    hash: "#" + base,
                });
            }
        }

        content = md.render(responseText);

        let lastTag: string | undefined;
        const stack: TreeData<Header>[] = [];
        for (const header of headers) {
            const treeData: TreeData<Header> = {
                text: header.content,
                icon: false,
                value: header,
                state: {
                    opened: false,
                    selected: false,
                    disabled: false,
                    loading: false,
                    highlighted: false,
                    openable: false,
                    dropPosition: DropPosition.empty,
                    dropAllowed: false,
                },
                children: [],
            };
            if (lastTag === undefined) {
                stack.push(treeData);
                toc.push(treeData);
            } else if (lastTag === header.tag) {
                if (stack.length >= 1) {
                    stack[stack.length - 1] = treeData;
                    if (stack.length >= 2) {
                        stack[stack.length - 2].children.push(treeData);
                    } else {
                        toc.push(treeData);
                    }
                } else {
                    stack.push(treeData);
                    toc.push(treeData);
                }
            } else if (lastTag < header.tag) {
                if (stack.length >= 1) {
                    stack[stack.length - 1].state.openable = true;
                    stack[stack.length - 1].state.opened = true;
                    stack[stack.length - 1].children.push(treeData);
                }
                stack.push(treeData);
            } else {
                while (stack.length >= 1 && stack[stack.length - 1].value!.tag >= header.tag) {
                    stack.pop();
                }
                if (stack.length >= 1) {
                    stack[stack.length - 1].children.push(treeData);
                } else {
                    stack.push(treeData);
                    toc.push(treeData);
                }
            }
            lastTag = header.tag;
        }

        // tslint:disable-next-line:no-unused-expression
        new App({ el: "#container" });
    }
};
request.open("GET", src);
request.send();

function normalizeId(id: string) {
    let result = "";
    for (const c of id) {
        if (c < "0"
            || (c > "9" && c < "A")
            || (c > "Z" && c < "a")
            || (c > "z" && c.charCodeAt(0) < 161)) {
            result += "-";
        } else {
            result += c;
        }
    }
    return result;
}

type Header = {
    tokenIndex: number; // eg: 100
    tag: string; // eg: h1, h2, h3
    content: string; // eg: foo bar
    index: number; // eg: 0, 1, 2
    id: string; // eg: header_foo-bar_1
    hash: string; // eg: #foo-bar_1
};
