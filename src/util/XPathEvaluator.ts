function nsResolver(prefix: string | null) {
    if (prefix === 'tei') {
        return 'http://www.tei-c.org/ns/1.0';
    } else if (prefix === 'xml') {
        return 'http://www.w3.org/XML/1998/namespace';
    } else {
        return 'http://www.tei-c.org/ns/1.0';
    }
}

export default class XPathEvaluator {
    private dom: XMLDocument;

    constructor (dom: XMLDocument) {
        this.dom = dom;
    }

    evaluate(node: Node, xpath: string, result_type: number) {
        return this.dom.evaluate(xpath, node, nsResolver, result_type, null);
    }

    firstNode(node: Node, xpath: string) {
        return this.evaluate(node, xpath, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
    }

    nodeIterator(node: Node, xpath: string) {
        return this.evaluate(node, xpath, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
    }

    stringValue(node: Node, xpath: string) {
        return this.evaluate(node, xpath, XPathResult.STRING_TYPE).stringValue;
    }

    booleanValue(node: Node, xpath: string) {
        return this.evaluate(node, xpath, XPathResult.BOOLEAN_TYPE).booleanValue;
    }

    numberValue(node: Node, xpath: string) {
        return this.evaluate(node, xpath, XPathResult.NUMBER_TYPE).numberValue;
    }
}
