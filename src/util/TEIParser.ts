import XPathEvaluator from './XPathEvaluator';
import get from './get';

export default export class TEIParser {
    private dom: XMLDocument;
    private xpath: XPathEvaluator;
    private sections: any;
    private parsed: any;

    constructor(data: string, sections: any) {
        let domParser = new DOMParser();
        this.dom = domParser.parseFromString(data, 'application/xml');
        this.xpath = new XPathEvaluator(this.dom);
        this.sections = sections;
        this.parsed = {};
    }

    public get(section: string) {
        if (this.parsed[section] === undefined) {
            if (this.sections[section].type === 'single-text') {
                this.parsed[section] = this.parseSingleText(this.sections[section]);
            } else if (this.sections[section].type === 'header') {
                this.parsed[section] = this.parseHeader(this.sections[section]);
            } else if (this.sections[section].type === 'multi-text') {
                this.parsed[section] = this.parseMultiText(this.sections[section]);
            }
        }
        return this.parsed[section];
    }

    private parseSingleText(section: any) {
        let node = <Element>this.xpath.firstNode(this.dom.documentElement, section.parser.selector);
        if (node) {
            return this.parseContentNode(node, section);
        } else {
            return null;
        }
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
                        console.log(e);
                    }
                }
            }
        });
        return result;
    }

    private parseContentMarks(node: Element, marks: any) {
        // Parse the marks of a text node
        let result = <any>[];
        Object.entries(marks).forEach((entry) => {
            let key = entry[0];
            let schema = <any>entry[1];
            let parsers = <any>[];
            if (schema.parser) {
                parsers.push(schema.parser);
            } else if (schema.parsers) {
                parsers = schema.parsers;
            }
            for (let idx = 0; idx < parsers.length; idx++) {
                if (this.xpath.booleanValue(node, parsers[idx].selector)) {
                    let mark = <any>{
                        type: key
                    };
                    if (schema.attrs) {
                        mark.attrs = this.parseContentAttributes(node, schema.attrs);
                    }
                    result.push(mark);
                }
            }
        });
        return result;
    }

    private parseContentNode(node: Element, section: any) {
        // Parse a single content node
        let entries = Object.entries(section.schema.nodes);
        for (let idx = 0; idx < entries.length; idx++) {
            let key = entries[idx][0];
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
                        type: key
                    };
                    if (nodeSchema.attrs) {
                        result.attrs = this.parseContentAttributes(node, nodeSchema.attrs);
                    }
                    if (nodeSchema.inline) {
                        // Inline nodes are either loaded as text nodes with marks or as complex text nodes
                        if (key === 'text') {
                            result.text = this.xpath.stringValue(node, parser.text);
                            result.marks = this.parseContentMarks(node, section.schema.marks);
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
                                            marks: this.parseContentMarks(node, section.schema.marks)
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
                            if (child) {
                                content.push(child);
                            }
                        }
                        result.content = content;
                    }
                    return result;
                }
            }
        }
    }

    private parseHeaderNode(node: Element, schema: any) {
        let elements = this.xpath.nodeIterator(node, schema.tag);
        let result = <any>[];
        let element = <Element>elements.iterateNext();
        while (element) {
            let obj = <any>{
                _attrs: {},
                _text: element.children.length === 0 ? this.xpath.stringValue(element, 'text()') : null
            };
            for(let idx = 0; idx < element.attributes.length; idx++) {
                obj._attrs[element.attributes[idx].name] = element.attributes[idx].value;
            }
            if (schema.children) {
                for (let idx = 0; idx < schema.children.length; idx++) {
                    let temp = this.parseHeaderNode(element, schema.children[idx]);
                    if (temp) {
                        obj[schema.children[idx].tag.substring(schema.children[idx].tag.indexOf(':') + 1)] = temp;
                    }
                }
            }
            result.push(obj);
            element = <Element>elements.iterateNext();
        }
        if (result.length === 0) {
            return null;
        } else {
            if (schema.multiple) {
                return result;
            } else {
                return result[0];
            }
        }
    }

    private parseHeader(section: any) {
        let header = <Element>this.xpath.firstNode(this.dom.documentElement, section.tag);
        let data = <any>{};
        for (let idx = 0; idx < section.schema.length; idx++) {
            let temp = this.parseHeaderNode(header, section.schema[idx]);
            if (temp) {
                data[section.schema[idx].tag.substring(4)] = temp;
            }
        }
        return data;
    }

    private parseMultiText(section: any) {
        let root = this.xpath.firstNode(this.dom.documentElement, section.parser.selector);
        if (root) {
            let parts = [];
            let nodes = this.xpath.nodeIterator(root, section.parts.parser.selector);
            let node = <Element>nodes.iterateNext();
            while (node) {
                let part = this.parseContentNode(node, section);
                if (part) {
                    parts.push({
                        id: node.getAttribute('xml:id'),
                        text: part
                    });
                }
                node = <Element>nodes.iterateNext();
            }
            return parts;
        }
        return [];
    }
}
