import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';
import {baseKeymap, setBlockType, toggleMark} from 'prosemirror-commands';
import {undo, redo, history} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';
import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';
import {EditorView} from 'prosemirror-view';

import SetDocAttr from './set-doc-attr';

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
    let selection = state.selection
    let blocks = []
    for(let idx = 0; idx < selection.$anchor.path.length; idx++) {
        if(typeof(selection.$anchor.path[idx]) === 'object') {
            blocks.push(selection.$anchor.path[idx]);
        }
    }
    return blocks
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
        this.schema = new Schema(this.args.schema);
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
        if (this.args.text !== this.sourceText) {
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
            if (node.type.isBlock) {
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
        this.args.update(state.doc.toJSON());
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
            setBlockType(this.schema.nodes[value], {})(this.editorView.state, this.editorView.dispatch)
        } else if (action === 'setBlockAttribute') {
            let {$from} = this.editorView.state.selection;
            let attrs = Object.assign({}, $from.parent.attrs);
            attrs[attribute] = value;
            setBlockType(this.schema.nodes[$from.parent.type.name], attrs)(this.editorView.state, this.editorView.dispatch)
        } else if (action === 'toggleBlockAttribute') {
            let {$from} = this.editorView.state.selection;
            let attrs = Object.assign({}, $from.parent.attrs);
            attrs[attribute] = !attrs[attribute];
            setBlockType(this.schema.nodes[$from.parent.type.name], attrs)(this.editorView.state, this.editorView.dispatch);
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
}
