function paragraph_attrs_to_class(node) {
    let classes = [];
    if(node.attrs.no_indent) {
        classes.push('no-indent')
    }
    if(node.attrs.text_align === 'center') {
        classes.push('text-center')
    } else if(node.attrs.text_align === 'right') {
        classes.push('text-right')
    }
    if(classes.length > 0) {
        return classes.join(' ')
    } else {
        return null
    }
}

function paragraph_class_to_attrs(dom) {
    let attrs = {
        no_indent: false,
        text_align: 'left'
    }
    if(dom.class) {
        if(dom.class.indexOf('no-indent') >= 0) {
            attrs.no_indent = true
        }
        if(dom.class.indexOf('text-center') >= 0) {
            attrs.text_align = 'center'
        } else if(dom.class.indexOf('text-right') >= 0) {
            attrs.text_align = 'right'
        }
    }
    return attrs
}

function mark_font_size_attr(dom) {
    let attrs = {
        size: ''
    }
    return attrs
}

export default {
    schema: {
        nodes: {
            doc: {
                content: 'block+'
            },
            paragraph: {
                group: 'block',
                content: 'inline*',
                attrs: {
                    no_indent: {
                        default: false
                    },
                    text_align: {
                        default: 'left'
                    }
                },
                toDOM(node) {return ['p', {class: paragraph_attrs_to_class(node)}, 0]},
                parseDOM: [{tag: 'p', paragraph_class_to_attrs}]
            },
            heading: {
                group: 'block',
                content: 'inline*',
                attrs: {
                    level: {
                        default: 1
                    }
                },
                defining: true,
                toDOM(node) {return ['h' + node.attrs.level, 0]},
                parseDOM: [
                    {tag: 'h1', attrs: {level: '1'}},
                    {tag: 'h2', attrs: {level: '2'}}
                ]
            },
            text: {
                group: 'inline',
                inline: true
            }
        },
        marks: {
            foreign: {
                toDOM() {return ['span', {class: 'foreign-language'}, 0]},
                parseDOM: [{tag: 'span.foreign-language'}]
            },
            letter_sparse: {
                toDOM() {return ['span', {class: 'letter-sparse'}, 0]},
                parseDOM: [{tag: 'span.letter-sparse'}]
            },
            sup: {
                toDOM() {return ['sup', 0]},
                parseDOM: [{tag: 'sup'}]
            },
            font_size: {
                attrs: {
                    size: {
                        default: ''
                    }
                },
                toDOM(mark) {return ['span', {class: 'font-size-' + mark.attrs.size}]},
                parseDOM: [{tag: 'span.font-size', mark_font_size_attr}]
            },
            page_break: {
                toDOM() {return ['span', {class: 'page-break'}, 0]},
                parseDOM: [{tag: 'span.page-break'}]
            },
            font_weight_bold: {
                toDOM() {return ['span', {class: 'font-weight-bold'}, 0]},
                parseDOM: [{tag: 'span.font-weight-bold'}]
            }
        }
    },
    parse: {
        blocks: {
            paragraph: {
                selector: 'tei:p',
                attrs: {
                    no_indent: {
                        selector: '@style',
                        values: {
                            'no-indent': true
                        }
                    },
                    text_align: {
                        selector: '@style',
                        values: {
                            'text-left': 'left',
                            'text-center': 'center',
                            'text-right': 'right',
                            'text-justify': 'justify'
                        }
                    }
                }
            },
            heading: {
                selector: 'tei:head',
                attrs: {
                    level: {
                        selector: '@type',
                        values: {
                            'level-1': '1',
                            'level-2': '2'
                        }
                    }
                }
            }
        },
        inline: {
            text: [
                {
                    selector: 'tei:seg',
                    text: 'text()'
                },
                {
                    selector: 'tei:hi',
                    text: 'text()',
                    marks: {
                        font_size: {
                            selector: '@style',
                            values: ['font-size-small', 'font-size-medium', 'font-size-large'],
                            attrs: {
                                size: {
                                    selector: '@style',
                                    values: {
                                        'font-size-small': 'small',
                                        'font-size-medium': 'medium',
                                        'font-size-large': 'large'
                                    }
                                }
                            }
                        },
                        font_weight_bold: {
                            selector: '@style',
                            values: ['font-weight-bold']
                        },
                        letter_sparse: {
                            selector: '@style',
                            values: ['letter-sparse']
                        },
                        sup: {
                            selector: '@style',
                            values: ['sup']
                        }
                    }
                },
                {
                    selector: 'tei:foreign',
                    text: 'text()',
                    marks: {
                        foreign: true
                    }
                },
                {
                    selector: 'tei:pb',
                    text: '@n',
                    marks: {
                        page_break: true
                    }
                }
            ]
        }
    }
};
