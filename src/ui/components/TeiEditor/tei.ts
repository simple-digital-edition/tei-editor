function parse_header() {

}

function load_text(elements) {
    let texts = [];
    for (let idx = 0; idx < elements.length; idx++) {
        let child = elements[idx];
        if (child.children.length > 0) {
            let tmp = load_text(child.children);
            let text = tmp[0];
            if (child.localName === 'foreign') {
                text.text = child.textContent;
                text.marks.push({type: 'foreign'});
            } else if (child.localName === 'hi') {
                text.text = child.textContent;
                let style = child.getAttribute('style');
                if (style) {
                    style = style.split(' ');
                    for (let idx2 = 0; idx2 < style.length; idx2++) {
                        if (style[idx2] === 'font-weight-bold') {
                            text.marks.push({type: 'font_weight_bold'})
                        } else if (style[idx2].indexOf('font-size-') === 0) {
                            text.marks.push({
                                type: 'font_size',
                                attrs: {
                                    size: style[idx2].substring(10)
                                }
                            })
                        } else if (style[idx2] === 'letter-sparse') {
                            text.marks.push({type: 'letter_sparse'});
                        } else if (style[idx2] === 'sup') {
                            text.marks.push({type: 'sup'});
                        }
                    }
                }
            } else if (child.localName === 'pb') {
                text.text = child.getAttribute('n');
                text.marks.push({type: 'page_break'});
            }
        } else {
            let text = {
                type: 'text',
                marks: [],
                text: ''
            }
            if (child.localName === 'seg') {
                text.text = child.textContent;
            } else if (child.localName === 'foreign') {
                text.text = child.textContent;
                text.marks.push({type: 'foreign'});
            } else if (child.localName === 'hi') {
                text.text = child.textContent;
                let style = child.getAttribute('style');
                if (style) {
                    style = style.split(' ');
                    for (let idx2 = 0; idx2 < style.length; idx2++) {
                        if (style[idx2] === 'font-weight-bold') {
                            text.marks.push({type: 'font_weight_bold'})
                        } else if (style[idx2].indexOf('font-size-') === 0) {
                            text.marks.push({
                                type: 'font_size',
                                attrs: {
                                    size: style[idx2].substring(10)
                                }
                            })
                        } else if (style[idx2] === 'letter-sparse') {
                            text.marks.push({type: 'letter_sparse'});
                        } else if (style[idx2] === 'sup') {
                            text.marks.push({type: 'sup'});
                        }
                    }
                }
            } else if (child.localName === 'pb') {
                text.text = child.getAttribute('n');
                text.marks.push({type: 'page_break'});
            }
            texts.push(text);
        }
    }
    return texts;
}

function parse_body(dom) {
    let nsResolver = dom.createNSResolver(dom.documentElement);
    let body = dom.evaluate('/tei:TEI/tei:text/tei:body', dom.documentElement, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE).iterateNext();
    let blocks = [];
    for (let idx = 0; idx < body.children.length; idx++) {
        let child = body.children[idx];
        if (child.localName === 'head') {
            let block = {'type': 'heading', 'attrs': {'level': '1'}, 'content': load_text(child.children)};
            if (child.getAttribute('type') === 'level-1') {
                block.attrs.level = '1';
            } else if (child.getAttribute('type') === 'level-2') {
                block.attrs.level = '2';
            }
            blocks.push(block);
        } else if (child.localName === 'p') {
            let block = {'type': 'paragraph', 'attrs': {no_indent: false, text_align: 'left'}, 'content': load_text(child.children)};
            let style = child.getAttribute('style');
            if (style) {
                style = style.split(' ');
                for (let idx2 = 0; idx2 < style.length; idx2++) {
                    if (style[idx2] === 'no-indent') {
                        block.attrs.no_indent = true;
                    } else if (style[idx2].indexOf('text-') === 0) {
                        block.attrs.text_align = style[idx2].substring(5);
                    }
                }
            }
            blocks.push(block);
        }
    }
    return {'type': 'doc', 'content': blocks};
}

export function parse_tei(data: string) {
    let parser = new DOMParser();
    let teiDom = parser.parseFromString(data, 'application/xml');
    return {
        header: parse_header(),
        body: parse_body(teiDom)
    }
}

export default null;
