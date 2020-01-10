// @ts-ignore
import { Mark } from 'tiptap'
// @ts-ignore
import { toggleMark } from 'tiptap-commands'

export default class MarkNode extends Mark {
    _config = {} as any;

    constructor(config: any) {
        super();
        this._config = config;
    }

    get name() {
        return this._config.name
    }

    get schema() {
        return {
            parseDOM: [
                {
                    tag: `span.mark-${this._config.name}`,
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
                },
            ],
            toDOM: (mark: any) => {
                let attributes = {
                    class: `node-${this._config.name}`,
                } as any;
                Object.entries(mark.attrs).forEach(([key, value]) => {
                    attributes[`data-${key}`] = value;
                });
                return ['span', {class: `mark-${this._config.name}`}, 0]
            },
        }
    }

    commands({ type }: any) {
        return () => toggleMark(type)
    }
}
