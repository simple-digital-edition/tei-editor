import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import {baseKeymap, setBlockType, toggleMark} from "prosemirror-commands"
import {undo, redo, history} from "prosemirror-history"
import {keymap} from "prosemirror-keymap"
import {Schema} from "prosemirror-model"
import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"

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
        no_indent: False,
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
    console.log('hm')
    return attrs
}

export default class Prosemirror extends Component {
    id: string = 'prosemirror-editor';

    constructor(options: object) {
        super(options);
        let schema = new Schema({
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
                    toDOM(node) {return ['h' + node.attrs.level.substring(6), 0]},
                    parseDOM: [
                        {tag: "h1", attrs: {level: 'level-1'}},
                        {tag: "h2", attrs: {level: 'level-2'}}
                    ]
                },
                text: {
                    group: 'inline',
                    inline: true
                }
            },
            marks: {
                foreign_language: {
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
                },
            }
        });

        let state = EditorState.create({
            schema,
            doc: [],
            plugins: [
                keymap(baseKeymap)
            ]
        });

        let view = new EditorView(this.element.querySelector('#' + this.id), {
            state,
            dispatchTransaction(transaction) {
            }
        });
    }
}
