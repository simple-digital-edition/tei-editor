import XPathEvaluator from './XPathEvaluator';

export default export class TEIParser {
    private dom: XMLDocument;
    private xpath: XPathEvaluator;
    private sections: object;
    private parsed: object;

    constructor(data: string, sections: object) {
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

    private parseSingleText(section: object) {
        let node = this.xpath.firstNode(this.dom.documentElement, section.parser.selector);
        if (node) {
            return this.parseContentNode(node, section);
        } else {
            return null;
        }
    }

    private parseContentAttributes(node, attrs: object) {
        // Parse attributes for nodes or marks. Attributes can have a type which is boolean, number, static, or string (default).
        let result = {};
        Object.entries(attrs).forEach((entry) => {
            let key = entry[0];
            let schema = entry[1];
            let parsers = [];
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

    private parseContentMarks(node, marks: object) {
        // Parse the marks of a text node
        let result = [];
        Object.entries(marks).forEach((entry) => {
            let key = entry[0];
            let schema = entry[1];
            let parsers = [];
            if (schema.parser) {
                parsers.push(schema.parser);
            } else if (schema.parsers) {
                parsers = schema.parsers;
            }
            for (let idx = 0; idx < parsers.length; idx++) {
                if (this.xpath.booleanValue(node, parsers[idx].selector)) {
                    let mark = {
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

    private parseContentNode(node, section: object) {
        // Parse a single content node
        let entries = Object.entries(section.schema.nodes);
        for (let idx = 0; idx < entries.length; idx++) {
            let key = entries[idx][0];
            let nodeSchema = entries[idx][1];
            let parsers = [];
            if (nodeSchema.parser) {
                parsers.push(nodeSchema.parser);
            } else if (nodeSchema.parsers) {
                parsers = parsers.concat(nodeSchema.parsers);
            }
            for (let idx2 = 0; idx2 < parsers.length; idx2++) {
                let parser = parsers[idx2];
                if (this.xpath.firstNode(node, 'self::' + parser.selector) !== null) {
                    // The first schema node where the parser selector matches is chosen as the result
                    let result = {
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

    private generatePermutations(values) {
        // Recursively generate all value permutations
        if (values.length > 1) {
            let permutations = [];
            this.generatePermutations(values.slice(1)).forEach((partPermutation) => {
                values[0].forEach((value) => {
                    permutations.push([value].concat(partPermutation.slice(0)));
                });
            });
            return permutations;
        } else {
            return values[0].map((value) => { return [value]; });
        }
    }

    private duplicateNode(node, fields) {
        // Generate duplicate nodes based on field value permutations
        let duplicates = [];
        let field = fields[0];
        let valueSets = fields.map((field) => {
            return get([node, field.tag.substring(field.tag.indexOf(':') + 1)])
        });
        this.generatePermutations(valueSets).forEach((permutation) => {
            let dupNode = deepclone([node]);
            for (let idx = 0; idx < fields.length; idx++) {
                dupNode[fields[idx].tag.substring(fields[idx].tag.indexOf(':') + 1)] = permutation[idx];
            }
            duplicates.push(dupNode);
        });
        return duplicates;
    }

    private parseHeaderNode(node, schema) {
        let elements = this.xpath.nodeIterator(node, schema.tag);
        let result = [];
        let element = elements.iterateNext();
        while (element) {
            let obj = {
                _attrs: {},
                _text: element.children.length === 0 ? this.xpath.stringValue(element, 'text()') : null
            };
            for(let idx = 0; idx < element.attributes.length; idx++) {
                obj._attrs[element.attributes[idx].name] = element.attributes[idx].value;
            }
            if (schema.children) {
                if (schema.deduplicate) {
                    // Force loading multiple children
                    schema.children.forEach((childSchema) => {
                        schema.deduplicate.merge.forEach((mergeSchema) => {
                            if (childSchema.tag === mergeSchema.tag) {
                                childSchema.multiple = true;
                            }
                        });
                    });
                }
                for (let idx = 0; idx < schema.children.length; idx++) {
                    let temp = this.parseHeaderNode(element, schema.children[idx]);
                    if (temp) {
                        obj[schema.children[idx].tag.substring(schema.children[idx].tag.indexOf(':') + 1)] = temp;
                    }
                }
                if (schema.deduplicate) {
                    // Undo force loading multiple children to enable saving to work
                    schema.children.forEach((childSchema) => {
                        schema.deduplicate.merge.forEach((mergeSchema) => {
                            if (childSchema.tag === mergeSchema.tag) {
                                childSchema.multiple = false;
                            }
                        });
                    });
                }
            }
            result.push(obj);
            element = elements.iterateNext();
        }
        if (result.length === 0) {
            return null;
        } else {
            if (schema.multiple) {
                if (schema.deduplicate) {
                    let dupResult = [];
                    result.forEach((item) => {
                        let needsDuplication = false;
                        schema.deduplicate.merge.forEach((mergeConfig) => {
                            let tmp = get([item, mergeConfig.tag.substring(mergeConfig.tag.indexOf(':') + 1)]);
                            if (tmp && tmp.length > 1) {
                                needsDuplication = true;
                            }
                        });
                        if (needsDuplication) {
                            dupResult = dupResult.concat(this.duplicateNode(item, schema.deduplicate.merge));
                        } else {
                            Object.keys(item).forEach((key) => {
                                if (item[key] && item[key].length === 1) {
                                    item[key] = item[key][0];
                                }
                            });
                            dupResult.push(item);
                        }
                    });
                    result = dupResult;
                }
                return result;
            } else {
                return result[0];
            }
        }
    }

    private parseHeader(section) {
        let header = this.xpath.firstNode(this.dom.documentElement, section.tag);
        let data = {};
        for (let idx = 0; idx < section.schema.length; idx++) {
            let temp = this.parseHeaderNode(header, section.schema[idx]);
            if (temp) {
                data[section.schema[idx].tag.substring(4)] = temp;
            }
        }
        return data;
    }

    private parseMultiText(section) {
        let root = this.xpath.firstNode(this.dom.documentElement, section.parser.selector);
        if (root) {
            let parts = [];
            let nodes = this.xpath.nodeIterator(root, section.parts.parser.selector);
            let node = nodes.iterateNext();
            while (node) {
                let part = this.parseContentNode(node, section);
                if (part) {
                    parts.push({
                        id: node.getAttribute('xml:id'),
                        text: part
                    });
                }
                node = nodes.iterateNext();
            }
            return parts;
        }
        return [];
    }
}
