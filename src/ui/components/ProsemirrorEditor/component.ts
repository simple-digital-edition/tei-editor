import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';
import {baseKeymap, setBlockType, toggleMark} from 'prosemirror-commands';
import {undo, redo, history} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';
import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {Transform, findWrapping, liftTarget} from 'prosemirror-transform';
import {EditorView} from 'prosemirror-view';

import SetDocAttr from './set-doc-attr';
import deepclone from '../deepclone/helper';

/**
 * Adds an item into an array, treating the array as a set. If the item to add is already contained in the array,
 * then nothing is changed.
 */
function addToSet(set, item) {
    let found = false;
    set.forEach((existing) => {
        if (existing === item) {
            found = true;
        }
    });
    if (!found) {
        set.push(item);
    }
}
/**
 * Returns a list of active mark names
 */
function getMarks(state) {
    let selection = state.selection;
    let marks = [];
    if(selection.from === selection.to) {
        // Get marks at the current cursor position
        if(state.doc.nodeAt(selection.from)) {
            state.doc.nodeAt(selection.from).marks.forEach((mark) => {
                addToSet(marks, mark);
            });
        }
        // Add marks from the previous cursor position if they are inclusive
        if(state.doc.nodeAt(selection.from - 1)) {
            state.doc.nodeAt(selection.from - 1).marks.forEach((mark) => {
                if(mark.type.spec.inclusive || mark.type.spec.inclusive === undefined) {
                    addToSet(marks, mark);
                }
            });
        }
        // Add stored marks
        if(state.storedMarks) {
            state.storedMarks.forEach((mark) => {
                addToSet(marks, mark);
            });
        }
    } else {
        // Add all marks between the selection markers
        state.doc.nodesBetween(selection.from, selection.to, (node) => {
            node.marks.forEach((mark) => {
                addToSet(marks, mark);
            });
        });
    }
    return marks;
}

/**
 * Gets a list of nodes from the current selection.
 */
function getBlockHierarchy(state) {
    let selection = state.selection;
    let blocks = [];
    for(let idx = 0; idx < selection.$from.path.length; idx++) {
        if(typeof(selection.$from.path[idx]) === 'object') {
            blocks.push(selection.$from.path[idx]);
        }
    }
    return blocks;
}

export default class ProsemirrorEditor extends Component implements HasGuid {
    _guid: number = null;
    sourceText: object = null;
    editorView: EditorView = null;
    @tracked status: object = null;
    schema: Schema = null;

    // Life-cycle handlers

    /**
     * Upon insertion of the component, initialise the Prosemirror instance.
     */
    didInsertElement() {
        this.makeSchema();
        this.sourceText = this.args.text;
        let state = EditorState.create({
            schema: this.schema,
            doc: null,
            plugins: [
                history(),
                keymap({
                    'Mod-z': undo,
                    'Mod-y': redo
                }),
                keymap(baseKeymap)
            ]
        });
        let component = this;
        component.editorView = new EditorView(document.querySelector('#' + this.prosemirrorId), {
            state,
            dispatchTransaction(transaction) {
                let newState = component.editorView.state.apply(transaction);
                component.stateChange(newState);
                component.editorView.updateState(newState);
            }
        });
    }

    /**
     * Upon updating of the text in the arguments, load the text into the editor.
     */
    didUpdate() {
        if (this.args.text && this.args.text !== this.sourceText) {
            this.sourceText = this.args.text;
            let state = EditorState.create({
                schema: this.schema,
                doc: this.schema.nodeFromJSON(this.sourceText),
                plugins: [
                    history(),
                    keymap({
                        'Mod-z': undo,
                        'Mod-y': redo
                    }),
                    keymap(baseKeymap)
                ]
            });
            this.editorView.updateState(state);
        }
    }

    // Computed properties

    /**
     * Generate a unique identifier for the editor.
     */
    get prosemirrorId() {
        return 'tei-editor-prosemirror-' + ensureGuid(this);
    }

    // Action handleres

    /**
     * Called when the editor state changes and updates the current blocks and marks.
     */
    private stateChange(state) {
        let status = {
            block: null,
            blocks: null,
            marks: {}
        };
        // Determine most specific active block
        let blocks = getBlockHierarchy(state);
        blocks.forEach((node) => {
            if (!node.type.isText) {
                if (status.blocks === null) {
                    status.blocks = {};
                }
                status.blocks[node.type.name] = node
                status.block = node
            }
        });
        // Determine all marks
        let marks = getMarks(state);
        marks.forEach((mark) => {
            status.marks[mark.type.name] = mark;
        });
        this.status = status;
        if (this.args.update) {
            this.args.update(state.doc.toJSON());
        }
    }

    /**
     * Handles the actions generated by the right-hand editing sidebar.
     */
    public menuAction(action, attribute, value, ev) {
        this.editorView.focus();
        if (value === 'ev.target.value') {
            value = ev.target.value;
        }
        if (action === 'setDocAttribute') {
            let transaction = this.editorView.state.tr;
            transaction.step(new SetDocAttr(attribute, value));
            this.editorView.dispatch(transaction);
        } else if (action === 'setBlockType') {
            if (this.schema.nodes[value].isBlock) {
                if (attribute.wrapping) {
                    let range = this.editorView.state.selection.$from.blockRange(this.editorView.state.selection.$to);
                    if (this.status.blocks[value]) {
                        this.editorView.dispatch(this.editorView.state.tr.lift(range, liftTarget(range)));
                    } else {
                        let wrapping = findWrapping(range, this.schema.nodes[value]);
                        if (wrapping) {
                            this.editorView.dispatch(this.editorView.state.tr.wrap(range, wrapping));
                        }
                    }
                } else {
                    setBlockType(this.schema.nodes[value], {})(this.editorView.state, this.editorView.dispatch)
                }
            } else {
                let type = this.schema.nodes[value];
                let {$from, $to} = this.editorView.state.selection;
                if (this.status.blocks[value]) {
                    let slice = $from.parent.slice($from.parentOffset, $to.parentOffset);
                    this.editorView.dispatch(this.editorView.state.tr.replaceRange($from.pos - 1, $to.pos, slice));
                } else {
                    if ($from.parent.canReplaceWith($from.index(), $to.index(), type)) {
                        let slice = $from.parent.slice($from.parentOffset, $to.parentOffset);
                        this.editorView.dispatch(this.editorView.state.tr.replaceSelectionWith(type.create({}, slice.content)));
                    }
                }
            }
        } else if (action === 'setBlockAttribute') {
            let {$from} = this.editorView.state.selection;
            let transaction = this.editorView.state.tr;
            for (let depth = $from.depth; depth >= 0; depth--) {
                let node = $from.node(depth);
                if (node.type.attrs[attribute] !== undefined) {
                    let attrs = Object.assign({}, node.attrs);
                    attrs[attribute] = value;
                    transaction.setNodeMarkup($from.start(depth) - 1, null, attrs);
                }
            }
            this.editorView.dispatch(transaction);
        } else if (action === 'toggleBlockAttribute') {
            let {$from} = this.editorView.state.selection;
            let transaction = this.editorView.state.tr;
            for (let depth = $from.depth; depth >= 0; depth--) {
                let node = $from.node(depth);
                if (node.type.attrs[attribute] !== undefined) {
                    let attrs = Object.assign({}, node.attrs);
                    attrs[attribute] = !attrs[attribute];
                    transaction.setNodeMarkup($from.start(depth) - 1, null, attrs);
                }
            }
            this.editorView.dispatch(transaction);
        } else if (action === 'setMarkAttribute') {
            attribute = attribute.split('.');
            let marks = getMarks(this.editorView.state);
            let {$from, $to} = this.editorView.state.selection
            let transaction = this.editorView.state.tr;
            transaction.removeMark($from.pos, $to.pos, this.schema.marks[attribute[0]]);
            if (value && value.trim() !== '') {
                let attrs = {}
                attrs[attribute[1]] = value;
                transaction.addMark($from.pos, $to.pos, this.schema.marks[attribute[0]].create(attrs));
            }
            this.editorView.dispatch(transaction);
        } else if (action === 'toggleMark') {
            toggleMark(this.schema.marks[attribute])(this.editorView.state, this.editorView.dispatch);
        }
    }

    // Helper functionality

    private makeSchema() {
        // Convert node attributes to DOM attributes
        function attrsNodeToDom(key, node) {
            let attrs = {class: 'tei-editor-' + key};
            if (node.attrs) {
                Object.entries(node.attrs).forEach((entry) {
                    attrs['data-' + entry[0]] = entry[1];
                });
            }
            return attrs;
        }
        // Convert DOM attributes to node attributes
        function attrsDomToNode(dom) {
            console.log(dom);
        }

        let schema = deepclone([this.args.schema]);
        Object.entries(schema.nodes).forEach((entry) => {
            let key = entry[0];
            let node = entry[1];
            if (key !== 'doc' && key !== 'text') {
                if (node.inline) {
                    node.toDOM = function(node) { return ['span', attrsNodeToDom(key, node), 0]};
                    node.parseDOM = [{tag: 'span.tei-editor-' + key, getAttrs: attrsDomToNode}];
                } else {
                    node.toDOM = function(node) { return ['div', attrsNodeToDom(key, node), 0]};
                    node.parseDOM = [{tag: 'div.tei-editor-' + key, getAttrs: attrsDomToNode}];
                }
            }
        });
        Object.entries(schema.marks).forEach((entry) => {
            let key = entry[0];
            let mark = entry[1];
            mark.toDOM = function(node) { return ['span', attrsNodeToDom(key, node), 0]};
            mark.parseDOM = [{tag: 'span.tei-editor-' + key, getAttrs: attrsDomToNode}];
        });
        this.schema = new Schema(schema);
    }
}
