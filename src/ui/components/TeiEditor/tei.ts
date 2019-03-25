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
}

export class TEIParser {
    private dom: XMLDocument;
    private xpath: XPathEvaluator;
    private parser: object;
    private _body: object;
    private _globalAnnotationText: object;
    private _individualAnnotations: Array;
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
        inlines.forEach(function(item) {
            if(!item.text) {
                console.log(inlines);
            }
        });
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
                    id: this.xpath.stringValue(annotation, '@xml:id'),
                    content: this.parseBlocks(this.xpath.nodeIterator(annotation,
                        this.parser.individualAnnotations.blockSelector), this.parser.individualAnnotations)
                });
                annotation = annotations.iterateNext();
            }
        }
        return this._individualAnnotations;
    }

    /**
     * Builds a forest of trees for the given elements. The forest is an object representation of the XML tree,
     * but without any ordering information.
     */
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
     */
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
        lines.push('  </tei:text>');
        return lines;
    }

    private serializeTextAttributes(dataAttrs, confAttrs) {
        let parts = [];
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
        return attrs;
    }

    private serializeBlockTextElement(block, config, indent) {
        let blockConf = config[block.type];
        let parts = [
            indent,
            '<',
            blockConf.node
        ];
        if (blockConf.attrs) {
            let attrs = this.serializeTextAttributes(block.attrs, blockConf.attrs);
            console.log(attrs);
            Object.keys(attrs).forEach((attrName) => {
                parts.push(' ');
                parts.push(attrName);
                parts.push('="')
                parts.push(attrs[attrName]);
                parts.push('"')
            });
        }
        parts.push('>');
        let lines = [
            parts.join('');
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
        Object.keys(attrs).forEach((attrName) => {
            parts.push(' ');
            parts.push(attrName);
            parts.push('="')
            parts.push(attrs[attrName]);
            parts.push('"')
        });
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

export default null;
