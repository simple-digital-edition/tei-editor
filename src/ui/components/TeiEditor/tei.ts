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
            console.log(this.parseContentNode(node, section));
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
                        if (value && value !== '') {
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
                for (let idx = 0; idx < schema.children.length; idx++) {
                    let temp = this.parseHeaderNode(element, schema.children[idx]);
                    if (temp) {
                        obj[schema.children[idx].tag.substring(4)] = temp;
                    }
                }
            }
            result.push(obj);
            element = elements.iterateNext();
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
            } else if (sections[key].type === 'header') {
                this.mergeTrees(root, this.serializeHeader(data[key], sections[key]));
            } else if (sections[key].type === 'multi-text') {
                this.mergeTrees(root, this.serializeMultiText(data[key], sections[key]));
            }
        }
        let lines = this.toString(root, '');
        lines.splice(0, 0, '<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('');
        return lines.join('\n');
    }

    private mergeTrees(base, merge) {
        // Merge one tree into another. If either of the two trees tries to merge at a level where sibling nodes have the
        // same tags, this will break
        if (base && merge) {
            for (let idx = 0; idx < merge.children.length; idx++) {
                let found = false;
                for (let idx2 = 0; idx2 < base.children.length; idx2++) {
                    if (base.children[idx2].node === merge.children[idx].node && this.objectsMatch(base.children[idx2].attrs, merge.children[idx].attrs)) {
                        this.mergeTrees(base.children[idx2], merge.children[idx]);
                        found = true;
                    }
                }
                if (!found) {
                    base.children.push(merge.children[idx]);
                }
            }
        }
    }

    private objectsMatch(a, b) {
        if (a && b) {
            if (typeof a !== typeof b) {
                return false;
            } else if (typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') {
                return a === b;
            }
            let keysA = Object.keys(a);
            let keysB = Object.keys(b);
            keysA.forEach((key) => {
                if (keysB.indexOf(key) < 0) {
                    return false;
                }
                if (!this.objectsMatch(a[key], b[key])) {
                    return false;
                }
                keysB.splice(keysB.indexOf(key), 1);
            });
            if (keysB.length > 0) {
                return false;
            }
            return true;
        } else if(!a && !b) {
            return true;
        } else {
            return false;
        }
    }

    private serializeSingleText(data: object, section: section) {
        if (data) {
            return {
                node: 'tei:TEI',
                children: [
                    {
                        node: section.serializer.tag,
                        children: [
                            this.serializeTextNode(data, section)
                        ]
                    }
                ]
            }
        } else {
            return null;
        }
    }

    private serializeTextNode(node: object, section: object) {
        // Basic structure
        let obj = {
            node: section.schema.nodes[node.type].serializer.tag,
            attrs: {},
            children: [],
            text: null
        };
        // Optional static attributes defined by the node itself
        if (section.schema.nodes[node.type].serializer.attrs) {
            Object.entries(section.schema.nodes[node.type].serializer.attrs).forEach((entry) => {
                obj.attrs[entry[0]] = [entry[1]];
            });
        }
        // Attributes are serialised as a dict of key => list pairs to simplify handling multi-value attributes
        if (node.attrs) {
            Object.entries(node.attrs).forEach((entry) => {
                let serializer = section.schema.nodes[node.type].attrs[entry[0]].serializer;
                let value = undefined;
                // Values can either be serialised directly, through string replacement in the value key, or
                // through value lookup in the values key.
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
                    if (serializer.attr === 'text()') {
                        obj.text = value;
                    } else {
                        if (obj.attrs[serializer.attr]) {
                            obj.attrs[serializer.attr].push(value);
                        } else {
                            obj.attrs[serializer.attr] = [value];
                        }
                    }
                }
            });
        }
        if (section.schema.nodes[node.type].inline) {
            if (node.content) {
                // Inline nodes with content are serialised like any other block node, if they have more than one
                // content element. Otherwise the text is fetched from the single child element
                if (node.content.length > 1 || (node.content[0].marks && node.content[0].marks.length > 0)) {
                    node.content.forEach((child) => {
                        obj.children.push(this.serializeTextNode(child, section));
                    });
                } else {
                    let temp = this.serializeTextNode(node.content[0], section);
                    if (section.schema.nodes[node.type].serializer.text) {
                        // By setting the text.attr value in the serialiser, the text can be serialised into an attribute
                        if (obj.attrs[section.schema.nodes[node.type].serializer.text.attr]) {
                            obj.attrs[section.schema.nodes[node.type].serializer.text.attr].push(temp.text);
                        } else {
                            obj.attrs[section.schema.nodes[node.type].serializer.text.attr] = [temp.text];
                        }
                    } else {
                        obj.text = temp.text;
                    }
                }
            } else if (node.text) {
                // As above allow serialisation of text into an attribute
                if (section.schema.nodes[node.type].serializer.text) {
                    if (obj.attrs[section.schema.nodes[node.type].serializer.text.attr]) {
                        obj.attrs[section.schema.nodes[node.type].serializer.text.attr].push(node.text);
                    } else {
                        obj.attrs[section.schema.nodes[node.type].serializer.text.attr] = [node.text];
                    }
                } else {
                    obj.text = node.text;
                }
            }
            if (node.marks) {
                // First map all marks to temporary objects
                let markObjs = node.marks.map((mark) => {
                    let markObj = {
                        node: obj.node,
                        attrs: {}
                    };
                    let serializer = section.schema.marks[mark.type].serializer;
                    if (serializer.tag) {
                        markObj.node = serializer.tag;
                    }
                    if (serializer.attrs) {
                        // Static attribute values can be serialised into the node for marks
                        Object.entries(serializer.attrs).forEach((entry) => {
                            if (entry[1].value) {
                                if (markObj.attrs[entry[0]]) {
                                    markObj.attrs[entry[0]].push(entry[1].value);
                                } else {
                                    markObj.attrs[entry[0]] = [entry[1].value];
                                }
                            }
                        });
                    }
                    if (mark.attrs) {
                        Object.entries(mark.attrs).forEach((entry) => {
                            // Marks with attributes can have those attributes serialised either via a value replacement
                            // or through value lookup in the values dict.
                            let value = undefined;
                            if (section.schema.marks[mark.type].attrs[entry[0]].serializer.value) {
                                value = section.schema.marks[mark.type].attrs[entry[0]].serializer.value.replace('${value}', entry[1]);
                            } else if (section.schema.marks[mark.type].attrs[entry[0]].serializer.values) {
                                if (section.schema.marks[mark.type].attrs[entry[0]].serializer.values[entry[1]]) {
                                    value = section.schema.marks[mark.type].attrs[entry[0]].serializer.values[entry[1]];
                                }
                            }
                            if (value !== undefined) {
                                if (markObj.attrs[section.schema.marks[mark.type].attrs[entry[0]].serializer.attr]) {
                                    markObj.attrs[section.schema.marks[mark.type].attrs[entry[0]].serializer.attr].push(value);
                                } else {
                                    markObj.attrs[section.schema.marks[mark.type].attrs[entry[0]].serializer.attr] = [value];
                                }
                            }
                        });
                    }
                    return markObj;
                });
                if ((new Set(markObjs.map((markObj) => { return markObj.node; }))).size > 1) {
                    // If there are multiple nodes in the marks, then the output needs to be nested
                    markObjs.sort((a, b) => {
                        if (a.node < b.node) {
                            return -1;
                        } else if (a.node > b.node) {
                            return 1;
                        } else if (a.node === b.node) {
                            return 0;
                        }
                    });
                    let target = obj;
                    target.node = null;
                    // Build the nested structure
                    markObjs.forEach((markObj) => {
                        if (target.node === null || target.node === markObj.node) {
                            target.node = markObj.node;
                            Object.entries(markObj.attrs).forEach((entry) => {
                                if (target.attrs[entry[0]]) {
                                    target.attrs[entry[0]] = target.attrs[entry[0]].concat(entry[1]);
                                } else {
                                    target.attrs[entry[0]] = entry[1];
                                }
                            });
                        } else {
                            let tmpObj = {
                                node: markObj.node,
                                attrs: markObj.attrs,
                                children: [],
                                text: target.text
                            };
                            target.text = null;
                            target.children.push(tmpObj);
                            target = tmpObj;
                        }
                    });
                } else {
                    // If there is only one node in the marks, then the output can be flattened
                    markObjs.forEach((markObj) => {
                        if (markObj.node) {
                            obj.node = markObj.node;
                        }
                        if (markObj.attrs) {
                            Object.entries(markObj.attrs).forEach((entry) => {
                                if (obj.attrs[entry[0]]) {
                                    obj.attrs[entry[0]] = obj.attrs[entry[0]].concat(entry[1]);
                                } else {
                                    obj.attrs[entry[0]] = entry[1];
                                }
                            });
                        }
                    });
                }
            }
        } else if (node.content) {
            // Block nodes simply get their content
            node.content.forEach((child) => {
                obj.children.push(this.serializeTextNode(child, section));
            });
        }
        return obj;
    }

    private serializeHeader(data: object, section: object) {
        return {
            node: 'tei:TEI',
            children: [
                {
                    node: section.tag
                    children: section.schema.map((config) => {return this.serializeMetadataNode(data[config.tag.substring(4)], config)})
                }
            ]
        }
    }

    private serializeMetadataNode(data: object, config: object) {
        if (config.multiple) {
            return data.map((item) => {
                let result = {
                    node: config.tag
                };
                if (item._text) {
                    result.text = item._text;
                }
                if (item._attrs) {
                    result.attrs = {};
                    Object.entries(item._attrs).forEach((entry) => {
                        result.attrs[entry[0]] = [entry[1]];
                    });
                }
                if (config.children) {
                    result.children = [];
                    for (let idx = 0; idx < config.children.length; idx++) {
                        if (item[config.children[idx].tag.substring(4)]) {
                            let temp = this.serializeMetadataNode(item[config.children[idx].tag.substring(4)], config.children[idx]);
                            if (Array.isArray(temp)) {
                                result.children = result.children.concat(temp);
                            } else {
                                result.children.push(temp);
                            }
                        }
                    }
                }
                return result;
            });
        } else {
            let result = {
                node: config.tag
            };
            if (data._text) {
                result.text = data._text;
            }
            if (data._attrs) {
                result.attrs = {};
                Object.entries(data._attrs).forEach((entry) => {
                    result.attrs[entry[0]] = [entry[1]];
                });
            }
            if (config.children) {
                result.children = [];
                for (let idx = 0; idx < config.children.length; idx++) {
                    if (data[config.children[idx].tag.substring(4)]) {
                        let temp = this.serializeMetadataNode(data[config.children[idx].tag.substring(4)], config.children[idx]);
                        if (Array.isArray(temp)) {
                            result.children = result.children.concat(temp);
                        } else {
                            result.children.push(temp);
                        }
                    }
                }
            }
            return result;
        }
    }

    private void serializeMultiText(data: object, section: object) {
        let wrapperNode = {
            node: section.parts.serializer.tag,
            children: data.map((text) => {
                return this.serializeTextNode(text.text, section)
            });
        };
        if (section.parts.serializer.attrs) {
            wrapperNode.attrs = {}
            Object.entries(section.parts.serializer.attrs).forEach((entry) => {
                wrapperNode.attrs[entry[0]] = [entry[1]];
            });
        }
        return {
            node: 'tei:TEI',
            children: [
                {
                    node: section.serializer.tag,
                    children: [
                        wrapperNode
                    ]
                }
            ]
        };
    }

    private toString(node, indentation) {
        function xmlSafe(txt) {
            return txt.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
        }

        // Render a node into an XML string representation as a list of lines
        let lines = [];
        let buffer = [indentation, '<', node.node];
        if (node.attrs) {
            Object.entries(node.attrs).forEach((entry) => {
                if (entry[1].length > 0) {
                    entry[1].sort();
                    buffer.push(' ' + entry[0] + '="' + xmlSafe(entry[1].join(' ')) + '"');
                }
            });
        }
        if (node.children && node.children.length > 0) {
            buffer.push('>');
            lines.push(buffer.join(''));
            node.children.forEach((child) => {
                lines = lines.concat(this.toString(child, indentation + '  '));
            });
            lines.push(indentation + '</' + node.node + '>');
        } else {
            if (node.text) {
                buffer.push('>');
                buffer.push(xmlSafe(node.text));
                buffer.push('</' + node.node + '>');
            } else {
                buffer.push('/>');
            }
            lines.push(buffer.join(''));
        }
        return lines;
    }
}

export default null;
