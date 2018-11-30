export default {
    blocks: {
        paragraph: {
            selector: 'tei:p',
            tag: 'p',
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
            tag: 'h1',
            attrs: {
                level: {
                    selector: '@type',
                    values: {
                        'level-1': 1,
                        'level-2': 2
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
};
