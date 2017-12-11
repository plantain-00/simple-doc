import Vue from "vue";
import Component from "vue-class-component";
import * as MarkdownIt from "markdown-it";
import * as hljs from "highlight.js";
import { EaseInOut } from "ease-in-out";
import { indexTemplateHtml } from "./variables";
import { EventData, TreeData, DropPosition, getId } from "tree-vue-component";

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
const preid = "toc_";

const enum PositionState {
    top,
    borderTop,
    middle,
    down,
}

/**
 * if the header element that related to the node is visible, select the node
 * collect all selected node to `selectedNodes`
 * @param node the node object
 * @param height the window height, to determine whether a header element is visible
 * @param path the node path in the tree
 * @param selectedNodeElements collect all selected node element
 * @param lastState the state of last node
 */
function setSelectionOfTree(node: TreeData<Header>, height: number, path: number[], selectedNodeElements: HTMLElement[], lastState: PositionState): PositionState {
    if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
            lastState = setSelectionOfTree(node.children[i], height, path.concat(i), selectedNodeElements, lastState);
        }
    }
    const headerElement = document.getElementById(node.value!.id);
    if (headerElement) {
        const top = headerElement.getBoundingClientRect().top;
        if (top < 0) {
            node.state.selected = lastState === PositionState.middle || lastState === PositionState.down;
            lastState = PositionState.top;
        } else if (top >= height) {
            node.state.selected = false;
            lastState = PositionState.down;
        } else if (top < 5) {
            node.state.selected = true;
            lastState = PositionState.borderTop;
        } else {
            node.state.selected = true;
            lastState = PositionState.middle;
        }
        if (node.state.selected) {
            const element = document.getElementById(getId(path, preid)!);
            if (element) {
                selectedNodeElements.push(element);
            }
        }
    }
    return lastState;
}

@Component({
    template: indexTemplateHtml,
})
class App extends Vue {
    content = content;
    toc = toc;
    isNavExpand = false;
    preid = preid;
    private contentScroll: EaseInOut;
    private tocScroll: EaseInOut;

    mounted() {
        this.contentScroll = new EaseInOut(currentValue => {
            (this.$refs.content as HTMLElement).scrollTop = currentValue;
        });
        this.tocScroll = new EaseInOut(currentValue => {
            (this.$refs.toc as HTMLElement).scrollTop = currentValue;
        });

        (this.$refs.content as HTMLElement).onscroll = ev => {
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

    toggle(eventData: EventData<Header>) {
        eventData.data.state.opened = !eventData.data.state.opened;
    }
    change(eventData: EventData<Header>) {
        location.hash = eventData.data.value!.hash;
    }
    toggleNavigation() {
        this.isNavExpand = !this.isNavExpand;
    }
    private setSelectionOfTrees() {
        const height = window.innerHeight || document.documentElement.clientHeight;
        const selectedNodes: HTMLElement[] = [];

        let state = PositionState.down;
        for (let i = this.toc.length - 1; i >= 0; i--) {
            state = setSelectionOfTree(this.toc[i], height, [i], selectedNodes, state);
        }

        if (selectedNodes.length > 0) {
            const tocElement = this.$refs.toc as HTMLElement;

            const firstSelectedNodePosition = selectedNodes[selectedNodes.length - 1].getBoundingClientRect();
            if (firstSelectedNodePosition.top <= 0) {
                this.tocScroll.start(tocElement.scrollTop, tocElement.scrollTop + firstSelectedNodePosition.top, 300);
            }

            const lastSelectedNodePosition = selectedNodes.length > 1 ? selectedNodes[0].getBoundingClientRect() : firstSelectedNodePosition;
            if (lastSelectedNodePosition.bottom >= height) {
                this.tocScroll.start(tocElement.scrollTop, tocElement.scrollTop + lastSelectedNodePosition.bottom - height, 300);
            }
        }
    }
    private navigateToHash(hash: string) {
        if (hash) {
            for (const header of headers) {
                if (header.hash === hash) {
                    document.title = header.content;
                    const headerElement = document.getElementById(header.id);
                    if (headerElement) {
                        const contentElement = this.$refs.content as HTMLElement;
                        this.contentScroll.start(contentElement.scrollTop, contentElement.scrollTop + headerElement.getBoundingClientRect().top);
                    }
                    return;
                }
            }
        }
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
