// @ts-ignore
import { Node } from 'tiptap';
// @ts-ignore
import { findParentNode } from 'prosemirror-utils';
// @ts-ignore
import { liftTarget } from 'prosemirror-transform';

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
            content: this._config.content + '+',
            //content: 'block+',
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

    commands({ type, schema }: any) {
        const itemType = schema.nodes[this._config.content];

        return () => {
            return (state: any, dispatch: any) => {
                const { selection } = state;
                const { $from, $to, from, to } = selection;
                const range = $from.blockRange($to);
                const target = range && liftTarget(range)

                if (!range || target === null) {
                    return false;
    		    }

                const parentList = findParentNode(node => node.type === type)(selection);

                if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
                    if (parentList.node.type === type) {
                        let tr = state.tr.lift(range, target);
                        tr = tr.setBlockType(from, to, schema.nodes.paragraph);
                        dispatch(tr);
                        return true;
                    }
                }

                let tr = state.tr.setBlockType(from, to, itemType);
                tr = tr.wrap(range, [{type: type}]);
                dispatch(tr);
                return false;
            }
        }
    }
}
