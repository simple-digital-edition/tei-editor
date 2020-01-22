import XPathEvaluator from './XPathEvaluator';
import get from './get';

export default class TEIParser {
    private dom: XMLDocument;
    private xpath: XPathEvaluator;
    private config: any;
    private doc: any;
    private nestedDocs: any;

    constructor(dom: XMLDocument, config: any) {
        this.dom = dom;
        this.xpath = new XPathEvaluator(this.dom);
        this.config = config;
    }

    public get() {
        if (!this.doc) {
            this.doc = {
                type: 'doc',
                content: [],
            };
            this.nestedDocs = {};
            if (this.config.parser && this.config.parser.selector) {
                let node = <Element>this.xpath.firstNode(this.dom.documentElement, this.config.parser.selector);
                if (node) {
                    for(let idx = 0; idx < node.children.length; idx++) {
                        let tmp = this.parseContentNode(node.children[idx], this.config);
                        if (tmp && !tmp.nestedDoc) {
                            this.doc.content.push(tmp);
                        } else if (tmp.nestedDoc) {
                            this.addNestedDoc(tmp);
                        }
                    }
                }
            }
        }
        return [this.doc, this.nestedDocs];
    }

    private parseContentAttributes(node: Element, attrs: any) {
        // Parse attributes for nodes or marks. Attributes can have a type which is boolean, number, static, or string (default).
        let result = <any>{};
        Object.entries(attrs).forEach((entry) => {
            let key = entry[0];
            let schema = <any>entry[1];
            let parsers = <any>[];
            if (schema.parser) {
                parsers.push(schema.parser);
            } else if (schema.parsers) {
                parsers = schema.parsers;
            }
            for (let idx = 0; idx < parsers.length; idx++) {
                let parser = parsers[idx];
                if (parser.type === 'boolean') {
                    result[key] = this.xpath.booleanValue(node, parser.selector);
                } else if (parser.type === 'number') {
                    try {
                        result[key] = this.xpath.numberValue(node, parser.selector);
                    } catch(e) {
                        // eslint-disable-next-line
                        console.log(e);
                    }
                } else if (parser.type === 'static') {
                    if (this.xpath.booleanValue(node, parser.selector)) {
                        result[key] = parser.value;
                    }
                } else {
                    try {
                        let value = this.xpath.stringValue(node, parser.selector);
                        if (value) {
                            result[key] = value;
                        }
                    } catch(e) {
                        // eslint-disable-next-line
                        console.log(e);
                    }
                }
            }
        });
        return result;
    }

    private parseContentMarks(node: Element, schema: any) {
        // Parse the marks of a text node
        let result = <any>[];
        schema.forEach((entry: any) => {
            if (entry.type === 'mark') {
                let parsers = <any>[];
                if (entry.parser) {
                    parsers.push(entry.parser);
                } else if (entry.parsers) {
                    parsers = entry.parsers;
                }
                for (let idx = 0; idx < parsers.length; idx++) {
                    if (this.xpath.booleanValue(node, parsers[idx].selector)) {
                        let mark = <any>{
                            type: entry.name
                        };
                        if (entry.attrs) {
                            mark.attrs = this.parseContentAttributes(node, entry.attrs);
                        }
                        result.push(mark);
                    }
                }
            }
        });
        return result;
    }

    private parseContentNode(node: Element, section: any) {
        // Parse a single content node
        let entries = Object.entries(section.schema);
        for (let idx = 0; idx < entries.length; idx++) {
            //let key = entries[idx][0];
            let nodeSchema = <any>entries[idx][1];
            let parsers = <any>[];
            if (nodeSchema.parser) {
                parsers.push(nodeSchema.parser);
            } else if (nodeSchema.parsers) {
                parsers = parsers.concat(nodeSchema.parsers);
            }
            for (let idx2 = 0; idx2 < parsers.length; idx2++) {
                let parser = parsers[idx2];
                if (this.xpath.firstNode(node, 'self::' + parser.selector) !== null) {
                    // The first schema node where the parser selector matches is chosen as the result
                    let result = <any>{
                        type: nodeSchema.name
                    };
                    if (nodeSchema.attrs) {
                        result.attrs = this.parseContentAttributes(node, nodeSchema.attrs);
                    }
                    if (nodeSchema.type === 'nested') {
                        result.nestedDoc = true;
                    }
                    if (nodeSchema.type === 'inline') {
                        // Inline nodes are either loaded as text nodes with marks or as complex text nodes
                        if (nodeSchema.name === 'text') {
                            result.text = this.xpath.stringValue(node, parser.text);
                            result.marks = this.parseContentMarks(node, section.schema);
                            if (node.children.length === 1) {
                                let temp = this.parseContentNode(node.children[0], section);
                                if (temp.text && temp.text !== '') {
                                    result.text = temp.text;
                                }
                                result.marks = result.marks.concat(temp.marks);
                            }
                        } else {
                            if (node.children.length === 0) {
                                // Inline nodes without children need a virtual text node added if they have text
                                if (this.xpath.stringValue(node, parser.text)) {
                                    result.content = [
                                        {
                                            type: 'text',
                                            text: this.xpath.stringValue(node, parser.text),
                                            marks: this.parseContentMarks(node, section.schema)
                                        }
                                    ];
                                }
                            } else {
                                let content = [];
                                for (let idx3 = 0; idx3 < node.children.length; idx3++) {
                                    let child = this.parseContentNode(node.children[idx3], section);
                                    if (child) {
                                        content.push(child);
                                    }
                                }
                                result.content = content;
                            }
                        }
                    } else {
                        let content = [];
                        for (let idx3 = 0; idx3 < node.children.length; idx3++) {
                            let child = this.parseContentNode(node.children[idx3], section);
                            if (child && !child.nestedDoc) {
                                content.push(child);
                            } else if (child.nestedDoc) {
                                this.addNestedDoc(child);
                            }
                        }
                        result.content = content;
                    }
                    return result;
                }
            }
        }
    }

    private addNestedDoc(nestedParent: any) {
        if (nestedParent.attrs && nestedParent.attrs.id) {
            if (!this.nestedDocs[nestedParent.type]) {
                this.nestedDocs[nestedParent.type] = {};
            }
            this.nestedDocs[nestedParent.type][nestedParent.attrs.id] = nestedParent;
            let nestedDoc = {
                type: 'doc',
                content: nestedParent.content,
            }
            nestedParent.content = [nestedDoc];
        }
    }
}
