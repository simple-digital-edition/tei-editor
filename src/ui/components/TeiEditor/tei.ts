import get from '../get/helper';

function nsResolver(prefix: string) {
    if (prefix === 'tei') {
        return 'http://www.tei-c.org/ns/1.0';
    } else if (prefix === 'xml') {
        return 'http://www.w3.org/XML/1998/namespace';
    } else {
        return 'http://www.tei-c.org/ns/1.0';
    }
}

class XPathEvaluator {
    private dom: XMLDocument;

    constructor (dom: XMLDocument) {
        this.dom = dom;
    }

    evaluate(node, xpath, result_type) {
        return this.dom.evaluate(xpath, node, nsResolver, result_type, null);
    }

    firstNode(node, xpath) {
        return this.evaluate(node, xpath, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
    }

    nodeIterator(node, xpath) {
        return this.evaluate(node, xpath, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
    }

    stringValue(node, xpath) {
        return this.evaluate(node, xpath, XPathResult.STRING_TYPE).stringValue;
    }

    booleanValue(node, xpath) {
        return this.evaluate(node, xpath, XPathResult.BOOLEAN_TYPE).booleanValue;
    }

    numberValue(node, xpath) {
        return this.evaluate(node, xpath, XPathResult.NUMBER_TYPE).numberValue;
    }
}

export class TEIParser {
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
            }
        }
        return this.parsed[section];
    }

    private parseSingleText(section: object) {
        let node = this.xpath.firstNode(this.dom.documentElement, section.selector);
        return this.parseContentNode(node, section);
    }

    private parseContentAttributes(node, attrs: object) {
        let result = {};
        Object.entries(attrs).forEach((entry) => {
            let key = entry[0];
            let schema = entry[1];
            if (schema.parser.type === 'boolean') {
                result[key] = this.xpath.booleanValue(node, schema.parser.selector);
            } else if (schema.parser.type === 'number') {
                try {
                    result[key] = this.xpath.numberValue(node, schema.parser.selector);
                } catch(e) {
                    console.log(e);
                }
            } else {
                try {
                    let value = this.xpath.stringValue(node, schema.parser.selector);
                    if (value && value !== '') {
                        result[key] = value;
                    }
                } catch(e) {
                    console.log(e);
                }
            }
        });
        return result;
    }

    private parseContentMarks(node, marks: object) {
        let result = [];
        Object.entries(marks).forEach((entry) => {
            let key = entry[0];
            let schema = entry[1];
            if (this.xpath.booleanValue(node, schema.parser.selector)) {
                let mark = {
                    type: key
                };
                result.push(mark);
            }
        });
        return result;
    }

    private parseContentNode(node, section: object) {
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
                    let result = {
                        type: key
                    };
                    if (nodeSchema.attrs) {
                        result.attrs = this.parseContentAttributes(node, nodeSchema.attrs);
                    }
                    if (nodeSchema.inline) {
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
                                result.content = [
                                    {
                                        type: 'text',
                                        text: this.xpath.stringValue(node, parser.text),
                                        marks: this.parseContentMarks(node, section.schema.marks)
                                    }
                                ]
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
}

export class TEISerializer {

    public serialize(data: object[], sections: object[]) {
        let root = {
            node: 'tei:TEI',
            attrs: {
                'xmlns:tei': ['http://www.tei-c.org/ns/1.0']
            },
            children: []
        }
        let keys = Object.keys(sections);
        for (let idx = 0; idx < keys.length; idx++) {
            let key = keys[idx];
            if (sections[key].type === 'single-text') {
                this.mergeTrees(root, this.serializeSingleText(data[key], sections[key]));
            }
        }
        let lines = this.toString(root, '  ');
        lines.splice(0, 0, '<?xml version="1.0" encoding="UTF-8"?>');
        return lines.join('\n');
    }

    private mergeTrees(base, merge) {
        for (let idx = 0; idx < merge.children.length; idx++) {
            let found = false;
            for (let idx2 = 0; idx2 < base.children.length; idx2++) {
                if (base.children[idx2].node === merge.children[idx2].node) {
                    this.mergeTrees(base.children[idx2].node, merge.children[idx2].node);
                    found = true;
                }
            }
            if (!found) {
                base.children.push(merge.children[idx]);
            }
        }
    }

    private serializeSingleText(data: object, section: section) {
        return {
            node: 'tei:TEI',
            children: [
                {
                    node: section.serializer.tag
                    children: [
                        this.serializeTextNode(data, section)
                    ]
                }
            ]
        }
    }

    private serializeTextNode(node: object, section: object) {
        let obj = {
            node: section.schema.nodes[node.type].serializer.tag,
            attrs: {},
            children: [],
            text: null
        };
        if (node.attrs) {
            Object.entries(node.attrs).forEach((entry) => {
                let serializer = section.schema.nodes[node.type].attrs[entry[0]].serializer;
                let value = undefined;
                if (serializer.values) {
                    if (serializer.values[entry[1]]) {
                        value = serializer.values[entry[1]];
                    }
                } else if (serializer.value) {
                    value = serializer.value.replace('${value}', entry[1]);
                } else {
                    value = entry[1];
                }
                if (value !== undefined) {
                    if (obj.attrs[serializer.attr]) {
                        obj.attrs[serializer.attr].push(value);
                    } else {
                        obj.attrs[serializer.attr] = [value];
                    }
                }
            });
        }
        if (node.content) {
            node.content.forEach((child) => {
                obj.children.push(this.serializeTextNode(child, section));
            });
        } else if (node.text) {
            obj.text = node.text;
        }
        if (node.marks) {
            node.marks.forEach((mark) => {
                let serializer = section.schema.marks[mark.type].serializer;
                if (serializer.tag) {
                    obj.node = serializer.tag;
                }
                if (serializer.attrs) {
                    Object.entries(serializer.attrs).forEach((entry) => {
                        if (entry[1].value) {
                            if (obj.attrs[entry[0]]) {
                                obj.attrs[entry[0]].push(entry[1].value);
                            } else {
                                obj.attrs[entry[0]] = [entry[1].value];
                            }
                        }
                    });
                }
            });
        }
        return obj;
    }

    private toString(node, indentation) {
        let lines = [];
        let buffer = [indentation, '<', node.node];
        if (node.attrs) {
            Object.entries(node.attrs).forEach((entry) => {
                buffer.push(' ' + entry[0] + '="' + entry[1].join(' ') + '"');
            });
        }
        buffer.push('>');
        if (node.children && node.children.length > 0) {
            lines.push(buffer.join(''));
            node.children.forEach((child) => {
                lines = lines.concat(this.toString(child, indentation + '  '));
            });
            lines.push(indentation + '</' + node.node + '>');
        } else {
            if (node.text) {
                buffer.push(node.text);
            }
            buffer.push('</' + node.node + '>');
            lines.push(buffer.join(''));
        }
        return lines;
    }
}

/*export class TEIParser {
    private dom: XMLDocument;
    private xpath: XPathEvaluator;
    private parser: object;
    private _body: object;
    private _globalAnnotationText: object;
    private _individualAnnotations: object[];
    private _metadata: object;

    constructor(data: string, parser: object) {
        let domParser = new DOMParser();
        this.dom = domParser.parseFromString(data, 'application/xml');
        this.xpath = new XPathEvaluator(this.dom);
        this.parser = parser;
    }

    private parseAttrs(source, conf, target) {
        for (let attrsKey in conf) {
            let attrsValue = conf[attrsKey];
            let instanceValue = this.xpath.stringValue(source, attrsValue.selector);
            if (instanceValue !== null) {
                if (attrsValue.values) {
                    instanceValue = instanceValue.split(' ');
                    instanceValue.forEach((item) => {
                        if (attrsValue.values[item] !== undefined) {
                            target[attrsKey] = attrsValue.values[item];
                        }
                    });
                } else if (attrsValue.strip_id) {
                    target[attrsKey] = instanceValue.substring(1);
                } else {
                    target[attrsKey] = instanceValue;
                }
            }
        }
    }

    private parseMarks(element, conf) {
        let marks = [];
        for(let markKey in conf) {
            let markValue = conf[markKey];
            if (markValue === true) {
                marks.push({
                    type: markKey
                });
            } else {
                let instanceValue = this.xpath.stringValue(element, markValue.selector);
                if (instanceValue !== null) {
                    if (markValue.values) {
                        let found = false;
                        instanceValue = instanceValue.split(' ');
                        instanceValue.forEach((item) => {
                            if (markValue.values.indexOf(item) >= 0) {
                                found = true;
                            }
                        });
                        if (found) {
                            let mark = {
                                type: markKey,
                                attrs: {}
                            };
                            if (markValue.attrs) {
                                this.parseAttrs(element, markValue.attrs, mark.attrs);
                            }
                            marks.push(mark);
                        }
                    } else {
                        let mark = {
                            type: markKey,
                            attrs: {}
                        }
                        if (markValue.attrs) {
                            this.parseAttrs(element, markValue.attrs, mark.attrs);
                        }
                        marks.push(mark);
                    }
                }
            }
        }
        return marks;
    }

    private parseInline(elements, parser) {
        let inlines = [];
        for (let idx = 0; idx < elements.length; idx++) {
            let child = elements[idx];
            if (child.children.length > 0) {
                let tmp = this.parseInline(child.children, parser);
                let inline = tmp[0];
                for (let inlineKey in parser.inline) {
                    let inlineValues = parser.inline[inlineKey];
                    inlineValues.forEach((inlineValue) => {
                        if (this.xpath.firstNode(child, 'self::' + inlineValue.selector) !== null) {
                            if (inlineValue.marks) {
                                inline.marks = this.parseMarks(child, inlineValue.marks);
                            }
                            if (inline.text !== null && inline.text !== undefined && inline.text !== '') {
                                inlines.push(inline);
                            }
                        }
                    });
                }
            } else {
                for (let inlineKey in parser.inline) {
                    let inlineValues = parser.inline[inlineKey];
                    inlineValues.forEach((inlineValue) => {
                        if (this.xpath.firstNode(child, 'self::' + inlineValue.selector) !== null) {
                            let inline = {
                                type: inlineKey,
                                marks: [],
                                text: null
                            };
                            if (inlineValue.text) {
                                inline.text = this.xpath.stringValue(child, inlineValue.text);
                            }
                            if (inlineValue.marks) {
                                inline.marks = this.parseMarks(child, inlineValue.marks);
                            }
                            if (inline.text !== null && inline.text !== undefined && inline.text !== '') {
                                inlines.push(inline);
                            }
                        }
                    });
                }
            }
        }
        return inlines;
    }

    private parseBlocks(elements, parser) {
        let element = elements.iterateNext();
        let blocks = [];
        while (element) {
            for (let blockKey in parser.blocks) {
                let blockValue = parser.blocks[blockKey];
                if (blockValue) {
                    if (this.xpath.firstNode(element, 'self::' + blockValue.selector) !== null) {
                        let block = {
                            type: blockKey,
                            attrs: {},
                            content: this.parseInline(element.children, parser)
                        };
                        if (blockValue.attrs) {
                            this.parseAttrs(element, blockValue.attrs, block.attrs)
                        }
                        blocks.push(block);
                        break;
                    }
                }
            }
            element = elements.iterateNext();
        }
        return blocks;
    }

    get body() {
        if (!this._body) {
            this._body = {
                type: 'doc',
                content: this.parseBlocks(this.xpath.nodeIterator(this.dom.documentElement,
                    this.parser.mainText.selector), this.parser.mainText)
            };
        }
        return this._body;
    }

    get globalAnnotationText() {
        if (!this._globalAnnotationText) {
            this._globalAnnotationText = {
                type: 'doc',
                content: this.parseBlocks(this.xpath.nodeIterator(this.dom.documentElement,
                    this.parser.globalAnnotations.selector), this.parser.globalAnnotations)
            };
        }
        return this._globalAnnotationText;
    }

    get individualAnnotations() {
        if (!this._individualAnnotations) {
            this._individualAnnotations = [];
            let annotations = this.xpath.nodeIterator(this.dom.documentElement, this.parser.individualAnnotations.selector);
            let annotation = annotations.iterateNext();
            while (annotation) {
                this._individualAnnotations.push({
                    type: 'doc',
                    attrs: {
                        id: this.xpath.stringValue(annotation, '@xml:id'),
                    },
                    content: this.parseBlocks(this.xpath.nodeIterator(annotation,
                        this.parser.individualAnnotations.blockSelector), this.parser.individualAnnotations)
                });
                annotation = annotations.iterateNext();
            }
        }
        return this._individualAnnotations;
    }

    / **
     * Builds a forest of trees for the given elements. The forest is an object representation of the XML tree,
     * but without any ordering information.
     * /
    private buildForest(elements) {
        let element = elements.iterateNext();
        let forest = {};
        while (element) {
            let tree = Object.assign({
                _attrs: {},
                _text: element.children.length === 0 ? this.xpath.stringValue(element, 'text()') : null
            }, this.buildForest(this.xpath.nodeIterator(element, 'tei:*')));
            for(let idx = 0; idx < element.attributes.length; idx++) {
                tree._attrs[element.attributes[idx].name] = element.attributes[idx].value;
            }
            if (forest[element.localName]) {
                if (!Array.isArray(forest[element.localName])) {
                    forest[element.localName] = [forest[element.localName]];
                }
                forest[element.localName].push(tree);
            } else {
                forest[element.localName] = tree;
            }
            element = elements.iterateNext();
        }
        return forest
    }

    get metadata() {
        if (!this._metadata) {
            this._metadata = this.buildForest(this.xpath.nodeIterator(this.dom.documentElement,
                '/tei:TEI/tei:teiHeader/tei:*'));
        }
        return this._metadata;
    }
}

export class TEISerializer {
    private serializer: object = null;

    constructor(serializer: object) {
        this.serializer = serializer;
    }

    public serialize(metadata, mainText, globalAnnotationText, individualAnnotations) {
        let lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0">'
        ];
        lines = lines.concat(this.serializeMetadata(metadata));
        lines = lines.concat(this.serializeText(mainText, globalAnnotationText, individualAnnotations));
        lines.push('</tei:TEI>');
        return lines.join('\n') + '\n';
    }

    /**
     * Generate the metadata TEI header.
     * /
    private serializeMetadata(metadata) {
        let lines = [];
        // Write the opening tag, including optional attributes and self-closing, if set
        function generateOpeningTag(confObj, data, selfClosing) {
            let parts = [
                '<',
                confObj.node
            ];
            if (confObj.attrs) {
                Object.keys(confObj.attrs).forEach((attr) => {
                    parts.push(' ');
                    parts.push(attr);
                    parts.push('="');
                    parts.push(get([data, confObj.attrs[attr]]));
                    parts.push('"');
                });
            }
            if (selfClosing) {
                parts.push('/');
            }
            parts.push('>');
            return parts.join('');
        }
        // Recursively serialise the metadata configuration
        function recursiveSerialize(confObj, data, indent) {
            if (confObj.multiple) {
                // This is a multiple-instance node
                get([data, confObj.multiple]).forEach((item) => {
                    if (confObj.children) {
                        lines.push(indent + generateOpeningTag(confObj, item, false));
                        confObj.children.forEach((child) => {
                            recursiveSerialize(child, item, indent + '  ');
                        });
                        lines.push(indent + '</' + confObj.node + '>');
                    } else if (confObj.text) {
                        lines.push(indent + generateOpeningTag(confObj, item, false) + get([item, confObj.text]) + '</' + confObj.node + '>');
                    } else {
                        lines.push(indent + generateOpeningTag(confObj, item, true));
                    }
                });
            } else if (confObj.children) {
                // This is a container tag with fixed children
                lines.push(indent + generateOpeningTag(confObj, data, false));
                confObj.children.forEach((child) => {
                    recursiveSerialize(child, data, indent + '  ');
                });
                lines.push(indent + '</' + confObj.node + '>');
            } else if (confObj.text) {
                // This is a text tag
                lines.push(indent + generateOpeningTag(confObj, data, false) + get([data, confObj.text]) + '</' + confObj.node + '>');
            } else {
                // This is an empty tag (might have attributes)
                lines.push(indent + generateOpeningTag(confObj, data, true));
            }
        }
        recursiveSerialize(this.serializer.metadata, metadata, '  ');
        return lines;
    }

    private serializeText(mainText, globalAnnotationText, individualAnnotations) {
        let lines = [
            '  <tei:text>',
        ];
        lines = lines.concat(this.serializeTextElement(mainText, this.serializer.mainText, '    '));
        lines = lines.concat(this.serializeTextElement(globalAnnotationText, this.serializer.globalAnnotations, '    '));
        lines = lines.concat(this.serializeTextElement({
            type: '_collection',
            content: individualAnnotations
        }, this.serializer.individualAnnotations, '    '));
        lines.push('  </tei:text>');
        return lines;
    }

    private serializeTextAttributes(attrs) {
        let parts = [];
        let keys = Object.keys(attrs);
        keys.sort();
        keys.forEach((attrName) => {
            parts.push(' ');
            parts.push(attrName);
            parts.push('="')
            let values = attrs[attrName].split(' ');
            values.sort();
            parts.push(values.join(' '));
            parts.push('"')
        });
        return parts;
    }

    private serializeBlockTextElement(block, config, indent) {
        let blockConf = config[block.type];
        let parts = [
            indent,
            '<',
            blockConf.node
        ];
        if (blockConf.attrs) {
            let dataAttrs = block.attrs;
            let confAttrs = blockConf.attrs;
            let attrs = {};
            confAttrs.forEach((confAttr) => {
                if (confAttr.selector) {
                    if (dataAttrs && dataAttrs[confAttr.selector]) {
                        if (confAttr.values && confAttr.values[dataAttrs[confAttr.selector]]) {
                            if (attrs[confAttr.name]) {
                                attrs[confAttr.name] = attrs[confAttr.name] + ' ' + confAttr.values[dataAttrs[confAttr.selector]];
                            } else {
                                attrs[confAttr.name] = confAttr.values[dataAttrs[confAttr.selector]];
                            }
                        } else if (confAttr.value && dataAttrs[confAttr.selector]) {
                            if (attrs[confAttr.name]) {
                                attrs[confAttr.name] = attrs[confAttr.name] + ' ' + confAttr.value.replace('${value}', dataAttrs[confAttr.selector]);
                            } else {
                                attrs[confAttr.name] = confAttr.value.replace('${value}', dataAttrs[confAttr.selector]);
                            }
                        }
                    }
                } else {
                    if (attrs[confAttr.name]) {
                        attrs[confAttr.name] = attrs[confAttr.name] + ' ' + confAttr.value;
                    } else {
                        attrs[confAttr.name] = confAttr.value
                    }
                }
            });
            parts = parts.concat(this.serializeTextAttributes(attrs));
        }
        parts.push('>');
        let lines = [
            parts.join('')
        ];
        if (block.content) {
            block.content.forEach((child) => {
                lines = lines.concat(this.serializeTextElement(child, config, indent + '  '));
            });
        }
        lines.push(indent + '</' + blockConf.node + '>');
        return lines;
    }

    private serializeInlineTextElement(inline, inlineConf, indent) {
        // Process element marks
        let targetNode = undefined;
        let attrs = {};
        let text = undefined;
        if (inline.marks) {
            inline.marks.forEach((mark) => {
                if (inlineConf.marks[mark.type]) {
                    if (targetNode === undefined) {
                        // Set the target node if desired
                        targetNode = inlineConf.marks[mark.type].node;
                    }
                    if (inlineConf.marks[mark.type].attrs) {
                        // Extract attributes
                        let confAttrs = inlineConf.marks[mark.type].attrs;
                        confAttrs.forEach((confAttr) => {
                            if (confAttr.selector) {
                                if (confAttr.selector === 'text()') {
                                    // Extract text value
                                    if (attrs[confAttr.name]) {
                                        attrs[confAttr.name] = attrs[confAttr.name] + ' ' + inline.text;
                                    } else {
                                        attrs[confAttr.name] = inline.text;
                                    }
                                } else if (mark.attrs) {
                                    if (confAttr.values && mark.attrs[confAttr.selector] && confAttr.values[mark.attrs[confAttr.selector]]) {
                                        // Extract via mapping attribute
                                        if (attrs[confAttr.name]) {
                                            attrs[confAttr.name] = attrs[confAttr.name] + ' ' + confAttr.values[mark.attrs[confAttr.selector]];
                                        } else {
                                            attrs[confAttr.name] = confAttr.values[mark.attrs[confAttr.selector]];
                                        }
                                    } else if (confAttr.value && mark.attrs[confAttr.selector]) {
                                        // Extract via string replacement
                                        if (attrs[confAttr.name]) {
                                            attrs[confAttr.name] = attrs[confAttr.name] + ' ' + confAttr.value.replace('${value}', mark.attrs[confAttr.selector]);
                                        } else {
                                            attrs[confAttr.name] = confAttr.value.replace('${value}', mark.attrs[confAttr.selector]);
                                        }
                                    }
                                }
                            } else {
                                // Hard-coded attribute value
                                if (attrs[confAttr.name]) {
                                    attrs[confAttr.name] = attrs[confAttr.name] + ' ' + confAttr.value;
                                } else {
                                    attrs[confAttr.name] = confAttr.value
                                }
                            }
                        });
                    }
                    if (inlineConf.marks[mark.type].text !== undefined) {
                        // Update the displayed text
                        text = inlineConf.marks[mark.type].text;
                    }
                }
            });
        }
        if (targetNode === undefined) {
            // Fallback target node is set in the configuration for the inline element
            targetNode = inlineConf.node;
        }
        if (text === undefined) {
            // Fallback text is the text of the inline element
            text = inline.text;
        }
        // Build the tag
        let parts = [
            indent,
            '<',
            targetNode
        ];
        parts = parts.concat(this.serializeTextAttributes(attrs));
        if (text !== undefined && text !== null) {
            parts.push('>');
            parts.push(text);
            parts.push('</' + targetNode + '>');
        } else {
            parts.push('/>');
        }
        return [parts.join('')];
    }

    private serializeTextElement(element, config, indent) {
        let lines = [];
        Object.keys(config).forEach((elementType) => {
            if (element.type === elementType) {
                let elementConf = config[elementType];
                if (elementConf.inline) {
                    lines = lines.concat(this.serializeInlineTextElement(element, elementConf, indent));
                } else {
                    lines = lines.concat(this.serializeBlockTextElement(element, config, indent));
                }
            }
        })
        return lines;
    }
}
*/
export default null;
