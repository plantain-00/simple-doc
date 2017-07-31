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
    return `<${token.tag} id="${getHeaderId(index)}">`;
};

function getHeaderId(id: number) {
    return `header-${id}`;
}

let content = "";
const headers: Header[] = [];
const toc: TreeData[] = [];

const enum PositionState {
    top,
    borderTop,
    middle,
    down,
}

function setSelectionOfTree(tree: TreeData, height: number, state: PositionState): PositionState {
    if (tree.children) {
        for (let i = tree.children.length - 1; i >= 0; i--) {
            state = setSelectionOfTree(tree.children[i], height, state);
        }
    }
    const headerElement = document.getElementById(getHeaderId(tree.value.id));
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
    toggle(eventData: EventData) {
        eventData.data.state.opened = !eventData.data.state.opened;
    }
    change(eventData: EventData) {
        const headerElement = document.getElementById(getHeaderId(eventData.data.value.id));
        if (headerElement) {
            document.body.scrollTop += headerElement.getBoundingClientRect().top;
        }
    }
    toggleNavigation() {
        this.isNavExpand = !this.isNavExpand;
    }
}

const request = new XMLHttpRequest();
request.onreadystatechange = () => {
    if (request.readyState === XMLHttpRequest.DONE) {
        content = md.render(request.responseText);

        const tokens = md.parse(request.responseText, {});
        for (let i = 0; i + 2 < tokens.length; i++) {
            if (tokens[i].type === "heading_open" && tokens[i + 2].type === "heading_close") {
                headers.push({
                    id: i,
                    tag: tokens[i].tag,
                    content: tokens[i + 1].content,
                });
            }
        }

        let lastTag: string | undefined;
        const stack: TreeData[] = [];
        for (const header of headers) {
            const treeData: TreeData = {
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
                while (stack.length >= 1 && stack[stack.length - 1].value.tag >= header.tag) {
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
request.open("GET", "./README.md");
request.send();

type Header = {
    id: number;
    tag: string;
    content: string;
};
