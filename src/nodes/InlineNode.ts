// @ts-ignore
import { Node } from 'tiptap'

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
            group: 'inline',
            inline: true,
            attrs: this._config.attrs,
            parseDOM: [{
                tag: `span.node-${this._config.name}`,
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
                return ['span', attributes, 0];
            },
        };
    }

    commands({ type }: any) {
        return (attrs: any) => {
            return (state: any, dispatch: any) => {
                const { selection } = state;
                const { $from, $to, from, to } = selection;
                let existing = false;
                state.doc.nodesBetween(from, to, (node: any) => {
                    if (node.type === type) {
                        existing = true;
                    }
                });
                let slice = $from.parent.slice($from.parentOffset, $to.parentOffset);
                if (existing) {
                    dispatch(state.tr.replaceRange(from-1, to+1, slice));
                } else {
                    dispatch(state.tr.replaceRangeWith(from, to, type.create(attrs, slice.content)));
                }
                return true;
            }
        }
    }
}
