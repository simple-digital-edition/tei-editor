export default class TEISerialiser {
    nested: any;

    public serialise(data: any, sections: any) {
        let root = {
            node: 'tei:TEI',
            attrs: {
                'xmlns:tei': ['http://www.tei-c.org/ns/1.0']
            },
            children: []
        }
        Object.entries(sections).forEach(([key, section]: any) => {
            if (section.type === 'MetadataEditor') {
                this.mergeTrees(root, this.serialiseHeader(data[key], section));
            }
        });
        Object.entries(sections).forEach(([key, section]: any) => {
            if (section.type === 'TextEditor') {
                this.mergeTrees(root, this.serialiseSingleText(data[key], section));
            }
        });
        let lines = this.toString(root, '');
        lines.splice(0, 0, '<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('');
        return lines.join('\n');
    }

    private mergeTrees(base: any, merge: any) {
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

    private objectsMatch(a: any, b: any) {
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

    private serialiseSingleText(data: any, section: any) {
        if (data) {
            let rootPath = section.serialiser.tag.split('/');
            this.nested = {} as any;
            let text = {
                node: rootPath[rootPath.length - 1],
                children: data.doc.content.map((item: any) => {
                    return this.serialiseTextNode(item, section.schema);
                }),
                attrs: {}
            } as any;
            if (section.serialiser.attrs) {
                Object.entries(section.serialiser.attrs).forEach(([key, value]) => {
                    if (text.attrs[key]) {
                        text.attrs[key].push(value);
                    } else {
                        text.attrs[key] = [value];
                    }
                });
            }
            Object.entries(this.nested).forEach(([key, ids]: any) => {
                new Set(ids).forEach((id: any) => {
                    if (data.nested[key] && data.nested[key][id]) {
                        text.children.push(this.serialiseTextNode(data.nested[key][id], section.schema));
                    }
                })
            });

            for (let idx = rootPath.length - 2; idx >= 0; idx--) {
                text = {
                    node: rootPath[idx],
                    children: [
                        text,
                    ]
                };
            }

            return {
                node: 'tei:TEI',
                children: [
                    text
                ]
            }
        } else {
            return null;
        }
    }

    private serialiseTextNode(node: any, schema: any) {
        let nodeSchema = schema.filter((part: any) => { return part.name === node.type && part.serialiser });
        if (nodeSchema.length === 1) {
            nodeSchema = nodeSchema[0];
            // Basic structure
            let obj = {
                node: nodeSchema.serialiser.tag,
                attrs: {},
                children: [],
                text: null
            } as any;
            // Optional static attributes defined by the node itself
            if (nodeSchema.serialiser.attrs) {
                Object.entries(nodeSchema.serialiser.attrs).forEach((entry: any) => {
                    obj.attrs[entry[0]] = [entry[1]];
                });
            }
            // Attributes are serialised as a dict of key => list pairs to simplify handling multi-value attributes
            if (node.attrs) {
                Object.entries(node.attrs).forEach((entry: any) => {
                    let serialiser = nodeSchema.attrs[entry[0]].serialiser;
                    if (serialiser) {
                        let value = undefined;
                        // Values can either be serialised directly, through string replacement in the value key, or
                        // through value lookup in the values key.
                        if (serialiser.values) {
                            if (serialiser.values[entry[1]]) {
                                value = serialiser.values[entry[1]];
                            }
                        } else if (serialiser.value) {
                            value = serialiser.value.replace('{value}', entry[1]);
                        } else {
                            value = entry[1];
                        }
                        if (value !== undefined) {
                            if (serialiser.attr === 'text()') {
                                obj.text = value;
                            } else {
                                if (obj.attrs[serialiser.attr]) {
                                    obj.attrs[serialiser.attr].push(value);
                                } else {
                                    obj.attrs[serialiser.attr] = [value];
                                }
                            }
                        }
                    }
                });
            }
            if (nodeSchema.type === 'inline') {
                if (node.content) {
                    // Inline nodes with content are serialised like any other block node, if they have more than one
                    // content element. Otherwise the text is fetched from the single child element
                    if (node.content.length > 1 || (node.content[0].marks && node.content[0].marks.length > 0)) {
                        node.content.forEach((child: any) => {
                            obj.children.push(this.serialiseTextNode(child, schema));
                        });
                    } else {
                        let temp = this.serialiseTextNode(node.content[0], schema);
                        if (nodeSchema.serialiser.text) {
                            // By setting the text.attr value in the serialiser, the text can be serialised into an attribute
                            if (obj.attrs[nodeSchema.serialiser.text.attr]) {
                                obj.attrs[nodeSchema.serialiser.text.attr].push(temp.text);
                            } else {
                                obj.attrs[nodeSchema.serialiser.text.attr] = [temp.text];
                            }
                        } else {
                            obj.text = temp.text;
                        }
                    }
                } else if (node.text) {
                    // As above allow serialisation of text into an attribute
                    if (nodeSchema.serialiser.text) {
                        if (obj.attrs[nodeSchema.serialiser.text.attr]) {
                            obj.attrs[nodeSchema.serialiser.text.attr].push(node.text);
                        } else {
                            obj.attrs[nodeSchema.serialiser.text.attr] = [node.text];
                        }
                    } else {
                        obj.text = node.text;
                    }
                }
                if (node.marks) {
                    // First map all marks to temporary objects
                    let markObjs = node.marks.map((mark: any) => {
                        let markSchema = schema.filter((part: any) => { return part.name === mark.type && part.serialiser });
                        if (markSchema.length === 1) {
                            markSchema = markSchema[0];
                            let markObj = {
                                node: obj.node,
                                attrs: {}
                            } as any;
                            let serialiser = markSchema.serialiser;
                            if (serialiser.tag) {
                                markObj.node = serialiser.tag;
                            }
                            if (serialiser.attrs) {
                                // Static attribute values can be serialised into the node for marks
                                Object.entries(serialiser.attrs).forEach((entry: any) => {
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
                                Object.entries(mark.attrs).forEach((entry: any) => {
                                    // Marks with attributes can have those attributes serialised either via a value replacement
                                    // or through value lookup in the values dict.
                                    let value = undefined;
                                    if (markSchema.attrs[entry[0]].serialiser.value) {
                                        value = markSchema.attrs[entry[0]].serialiser.value.replace('{value}', entry[1]);
                                    } else if (markSchema.attrs[entry[0]].serialiser.values) {
                                        if (markSchema.attrs[entry[0]].serialiser.values[entry[1]]) {
                                            value = markSchema.attrs[entry[0]].serialiser.values[entry[1]];
                                        }
                                    }
                                    if (value !== undefined) {
                                        if (markObj.attrs[markSchema.attrs[entry[0]].serialiser.attr]) {
                                            markObj.attrs[markSchema.attrs[entry[0]].serialiser.attr].push(value);
                                        } else {
                                            markObj.attrs[markSchema.attrs[entry[0]].serialiser.attr] = [value];
                                        }
                                    }
                                });
                            }
                            return markObj;
                        } else {
                            return null;
                        }
                    }).filter((markObj: any) => { return markObj; });
                    if ((new Set(markObjs.map((markObj: any) => { return markObj.node; }))).size > 1) {
                        // If there are multiple nodes in the marks, then the output needs to be nested
                        markObjs.sort((a: any, b: any) => {
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
                        markObjs.forEach((markObj: any) => {
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
                        markObjs.forEach((markObj: any) => {
                            if (markObj) {
                                if (markObj.node) {
                                    obj.node = markObj.node;
                                }
                                if (markObj.attrs) {
                                    Object.entries(markObj.attrs).forEach((entry: any) => {
                                        if (obj.attrs[entry[0]]) {
                                            obj.attrs[entry[0]] = obj.attrs[entry[0]].concat(entry[1]);
                                        } else {
                                            obj.attrs[entry[0]] = entry[1];
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            } else if (node.content) {
                // Block nodes simply get their content
                node.content.forEach((child: any) => {
                    if (child.type === 'doc') {
                        if (child.content) {
                            child.content.forEach((subChild: any) => {
                                obj.children.push(this.serialiseTextNode(subChild, schema));
                            });
                        }
                    } else {
                        obj.children.push(this.serialiseTextNode(child, schema));
                    }
                });
            }
            // Check for links to nested objects
            if (nodeSchema.reference) {
                if (!this.nested[nodeSchema.reference.type]) {
                    this.nested[nodeSchema.reference.type] = [];
                }
                this.nested[nodeSchema.reference.type].push(node.attrs[nodeSchema.reference.attr]);
            }
            if (obj.children.length > 0 || obj.text || Object.keys(obj.attrs).length > 0) {
                return obj;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    private serialiseHeader(data: any, section: any) {
        return {
            node: 'tei:TEI',
            children: [
                {
                    node: 'tei:teiHeader',
                    children: section.schema.map((config: any) => {return this.serialiseMetadataNode(data[config.tag.substring(4)], config)})
                }
            ]
        }
    }

    private serialiseMetadataNode(data: any, config: any) {
        if (config.multiple) {
            let items = data.map((item: any) => {
                let result = {
                    node: config.tag
                } as any;
                if (item._text) {
                    result.text = item._text;
                }
                if (item._attrs) {
                    result.attrs = {};
                    Object.entries(item._attrs).forEach((entry: any) => {
                        result.attrs[entry[0]] = [entry[1]];
                    });
                }
                if (config.children) {
                    result.children = [];
                    for (let idx = 0; idx < config.children.length; idx++) {
                        if (item[config.children[idx].tag.substring(4)]) {
                            let temp = this.serialiseMetadataNode(item[config.children[idx].tag.substring(4)], config.children[idx]);
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
            return items;
        } else {
            let result = {
                node: config.tag
            } as any;
            if (data) {
                if (data._text) {
                    result.text = data._text;
                }
                if (data._attrs) {
                    result.attrs = {};
                    Object.entries(data._attrs).forEach((entry: any) => {
                        result.attrs[entry[0]] = [entry[1]];
                    });
                }
                if (config.children) {
                    result.children = [];
                    for (let idx = 0; idx < config.children.length; idx++) {
                        if (data[config.children[idx].tag.substring(4)]) {
                            let temp = this.serialiseMetadataNode(data[config.children[idx].tag.substring(4)], config.children[idx]);
                            if (Array.isArray(temp)) {
                                result.children = result.children.concat(temp);
                            } else {
                                result.children.push(temp);
                            }
                        }
                    }
                }
            }
            return result;
        }
    }

    private toString(node: any, indentation: string) {
        function xmlSafe(txt: string) {
            return txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // Render a node into an XML string representation as a list of lines
        let lines = [] as any[];
        if (node) {
            let buffer = [indentation, '<', node.node];
            if (node.attrs) {
                Object.entries(node.attrs).forEach((entry: any) => {
                    if (entry[1].length > 0) {
                        entry[1].sort();
                        buffer.push(' ' + entry[0] + '="' + xmlSafe(entry[1].join(' ')) + '"');
                    }
                });
            }
            if (node.children && node.children.length > 0) {
                buffer.push('>');
                lines.push(buffer.join(''));
                node.children.forEach((child: any) => {
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
        }
        return lines;
    }
}
