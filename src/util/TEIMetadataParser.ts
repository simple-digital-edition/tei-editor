import XPathEvaluator from './XPathEvaluator';
import get from './get';

export default class TEIMetadataParser {
    private dom: XMLDocument;
    private xpath: XPathEvaluator;
    private config: any;
    private data: any;

    constructor(dom: XMLDocument, config: any) {
        this.dom = dom;
        this.xpath = new XPathEvaluator(this.dom);
        this.config = config;
    }

    public get() {
        if (!this.data) {
            let header = <Element>this.xpath.firstNode(this.dom.documentElement, '/tei:TEI/tei:teiHeader');
            this.data = {};
            for (let idx = 0; idx < this.config.schema.length; idx++) {
                let temp = this.parseHeaderNode(header, this.config.schema[idx]);
                if (temp) {
                    this.data[this.config.schema[idx].tag.substring(4)] = temp;
                }
            }
        }
        return this.data;
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
}
