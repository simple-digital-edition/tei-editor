// @ts-ignore
import { Node } from 'tiptap'
// @ts-ignore
import { setBlockType } from 'tiptap-commands';

export default class BlockNode extends Node {
    _config = {} as any;

    constructor(config: any) {
        super();
        this._config = config;
    }

    get name() {
        return this._config.name;
    }

    get schema() {
        return {
            content: 'inline*',
            group: 'block',
            draggable: false,
            attrs: this._config.attrs,
            parseDOM: [{
                tag: `div.node-${this._config.name}`,
                getAttrs: (dom: HTMLElement) => {
                    let attrs = {} as any;
                    if (this._config.attrs) {
                        Object.keys(this._config.attrs).forEach((key) => {
                            let value = dom.getAttribute(`data-${key}`);
                            if (value) {
                                attrs[key] = value;
                            }
                        });
                    }
                    return attrs;
                }
            }],
            toDOM: (node: any) => {
                let attributes = {
                    class: `node-${this._config.name}`,
                } as any;
                Object.entries(node.attrs).forEach(([key, value]) => {
                    attributes[`data-${key}`] = value;
                });
                return ['div', attributes, 0];
            },
        };
    }

    commands({ type }: any) {
        return (attrs: any) => setBlockType(type, attrs);
    }
}
