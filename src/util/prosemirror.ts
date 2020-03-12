import { NodeSpec, MarkSpec } from 'prosemirror-model';

import { TextEditorNodeConfig } from '@/interfaces';

export function generateSchemaNodes(schema: TextEditorNodeConfig[]) {
    const nodes = {
        doc: {
            content: 'block+',
        }
    } as { [x: string]: NodeSpec };
    schema.forEach((config) => {
        if (config.type === 'block') {
            nodes[config.name] = {
                content: 'inline*',
                group: 'block',
                attrs: config.attrs,
                parseDom: [{
                    tag: `div.node-${config.name}`,
                    getAttrs: (dom: HTMLElement) => {
                        let attrs = {} as any;
                        if (config.attrs) {
                            Object.keys(config.attrs).forEach((key) => {
                                let value = dom.getAttribute(`data-${key}`);
                                if (value) {
                                    attrs[key] = value;
                                }
                            });
                        }
                        return attrs;
                    }
                }],
                toDOM: (node) => {
                    let attributes = {
                        class: `node-${config.name}`,
                    } as any;
                    Object.entries(node.attrs).forEach(([key, value]) => {
                        attributes[`data-${key}`] = value;
                    });
                    return ['div', attributes, 0];
                },
            };
        } else if (config.type === 'wrapping') {
            nodes[config.name] = {
                content: config.content + '+',
                group: 'block',
                attrs: config.attrs,
                parseDOM: [{
                    tag: `div.node-${config.name}`,
                    getAttrs: (dom: HTMLElement) => {
                        let attrs = {} as any;
                        if (config.attrs) {
                            Object.keys(config.attrs).forEach((key) => {
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
                        class: `node-${config.name}`,
                    } as any;
                    Object.entries(node.attrs).forEach(([key, value]) => {
                        attributes[`data-${key}`] = value;
                    });
                    return ['div', attributes, 0];
                },
            };
        } else if (config.type === 'inline' && config.name === 'text') {
            nodes.text = {
                group: 'inline',
            };
        } else if (config.type === 'inline' && config.name !== 'text') {
            nodes[config.name] = {
                content: 'inline*',
                group: 'inline',
                inline: true,
                attrs: config.attrs,
                parseDOM: [{
                    tag: `span.node-${config.name}`,
                    getAttrs: (dom: HTMLElement) => {
                        let attrs = {} as any;
                        if (config.attrs) {
                            Object.keys(config.attrs).forEach((key) => {
                                let value = dom.getAttribute(`data-${key}`);
                                if (value) {
                                    attrs[key] = value;
                                }
                            });
                        }
                        return attrs;
                    }
                }],
                toDOM: (node) => {
                    let attributes = {
                        class: `node-${config.name}`,
                    } as any;
                    Object.entries(node.attrs).forEach(([key, value]) => {
                        attributes[`data-${key}`] = value;
                    });
                    return ['span', attributes, 0];
                },
            };
        }
    });
    return nodes;
}

export function generateSchemaMarks(schema: TextEditorNodeConfig[]) {
    const marks = {
    } as { [x: string]: MarkSpec };
    schema.forEach((config) => {
        if (config.type === 'mark') {
            marks[config.name] = {
                attrs: config.attrs,
                parseDOM: [
                    {
                        tag: `span.mark-${config.name}`,
                        getAttrs: (dom: HTMLElement) => {
                            let attrs = {} as any;
                            if (config.attrs) {
                                Object.keys(config.attrs).forEach((key) => {
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
                        class: `mark-${config.name}`,
                    } as any;
                    Object.entries(mark.attrs).forEach(([key, value]) => {
                        if (value) {
                            attributes[`data-${key}`] = value;
                        }
                    });
                    return ['span', attributes, 0]
                },
            };
        }
    });
    return marks;
}
