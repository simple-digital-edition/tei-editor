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

import { TEIParser } from './tei';
import deepclone from '../deepclone/helper';
import get from '../get/helper';
import set from '../set/helper';

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
            let node_type = selection.$anchor.path[idx].type
            if(node_type.name !== 'doc') {
                blocks.splice(0, 0, selection.$anchor.path[idx])
            }
        }
    }
    return blocks
}

export default class TeiEditor extends Component implements HasGuid {
    _guid: number = null;
    schema: Schema = null;
    mainTextView: EditorView = null;
    @tracked status: object = null;
    @tracked currentView: string = '#tei-editor-main-text';
    @tracked loaded: boolean = false;
    @tracked metadata: object = null;

    // Life-cycle handlers

    constructor(options: object) {
        super(options);
        this.schema = new Schema(window.teiEditorConfig.schema);
    }

    /**
     * Upon insertion of the component, initialise the Prosemirror instance.
     */
    didInsertElement() {
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
        component.mainTextView = new EditorView(document.querySelector('#' + this.prosemirrorId), {
            state,
            dispatchTransaction(transaction) {
                let newState = component.mainTextView.state.apply(transaction);
                component.stateChange(newState);
                component.mainTextView.updateState(newState);
            }
        });
    }

    // Computed properties

    /**
     * Generate a unique identifier for the editor.
     */
    get prosemirrorId() {
        return 'teieditor-' + ensureGuid(this);
    }

    /**
     * Return the main text sidebar configuration.
     */
    get mainTextSidebarConfig() {
        return window.teiEditorConfig.ui.main_text_sidebar;
    }

    /**
     * Return the metadata configuration.
     */
    get metadataConfig() {
        return window.teiEditorConfig.ui.metadata;
    }

    // Action handlers

    /**
     * Called when the editor state changes and updates the current blocks and marks.
     */
    private stateChange(state) {
        let status = {
            block: null,
            marks: {}
        };
        // Determine most specific active block
        let blocks = getBlockHierarchy(state);
        blocks.forEach((node) => {
            if (node.type.isBlock) {
                status.block = node;
            }
        });
        // Determine all marks
        let marks = getMarks(state);
        marks.forEach((mark) => {
            status.marks[mark.type.name] = mark;
        });
        this.status = status;
    }

    /**
     * Handles the actions generated by the right-hand editing sidebar.
     */
    public menuAction(action, attribute, value, ev) {
        this.mainTextView.focus();
        if (value === 'ev.target.value') {
            value = ev.target.value;
        }
        if (action === 'setBlockType') {
            setBlockType(this.schema.nodes[value], {})(this.mainTextView.state, this.mainTextView.dispatch)
        } else if (action === 'setBlockAttribute') {
            let {$from} = this.mainTextView.state.selection;
            let attrs = Object.assign({}, $from.parent.attrs);
            attrs[attribute] = value;
            setBlockType(this.schema.nodes[$from.parent.type.name], attrs)(this.mainTextView.state, this.mainTextView.dispatch)
        } else if (action === 'toggleBlockAttribute') {
            let {$from} = this.mainTextView.state.selection;
            let attrs = Object.assign({}, $from.parent.attrs);
            attrs[attribute] = !attrs[attribute];
            setBlockType(this.schema.nodes[$from.parent.type.name], attrs)(this.mainTextView.state, this.mainTextView.dispatch);
        } else if (action === 'setMarkAttribute') {
            attribute = attribute.split('.');
            let marks = getMarks(this.mainTextView.state);
            let {$from, $to} = this.mainTextView.state.selection
            let transaction = this.mainTextView.state.tr;
            transaction.removeMark($from.pos, $to.pos, this.schema.marks[attribute[0]]);
            if (value && value.trim() !== '') {
                let attrs = {}
                attrs[attribute[1]] = value;
                transaction.addMark($from.pos, $to.pos, this.schema.marks[attribute[0]].create(attrs));
            }
            this.mainTextView.dispatch(transaction);
        } else if (action === 'toggleMark') {
            toggleMark(this.schema.marks[attribute])(this.mainTextView.state, this.mainTextView.dispatch);
        }
    }

    public setBlockAttribute(attribute, value, ev) {
        ev.preventDefault();
    }

    public loadFile(ev) {
        ev.preventDefault();
        let component = this;
        let fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('class', 'hidden');
        document.querySelector('body').appendChild(fileSelector);
        fileSelector.click();
        fileSelector.addEventListener('change', function(ev) {
            let files = (<HTMLInputElement>ev.target).files;
            if (files.length > 0) {
                let reader = new FileReader();
                reader.onload = (ev) => {
                    let parser = new TEIParser(ev.target.result, window.teiEditorConfig);
                    let doc = component.schema.nodeFromJSON(parser.body);
                    let state = EditorState.create({
                        schema: component.schema,
                        doc: doc,
                        plugins: [
                            history(),
                            keymap({
                                'Mod-z': undo,
                                'Mod-y': redo
                            }),
                            keymap(baseKeymap)
                        ]
                    });
                    component.mainTextView.updateState(state);
                    component.metadata = parser.metadata;
                    component.loaded = true;
                }
                reader.readAsText(files[0]);
            }
            fileSelector.remove();
        });
    }

    public setView(view, ev) {
        ev.preventDefault();
        document.querySelector(this.currentView).setAttribute('aria-hidden', 'true');
        this.currentView = view;
        document.querySelector(this.currentView).setAttribute('aria-hidden', 'false');
    }

    /**
     * Sets the content of a single value field, regardless whether it is an attribute or text. Also handles traversal
     * through array indices.
     */
    public setMetadataField(value_key, ev) {
        ev.preventDefault();
        let clone = deepclone([this.metadata]);
        clone = set([clone, value_key, ev.target.value]);
        this.metadata = clone;
    }

    /**
     * Adds a row to a multi-row field.
     */
    public addMultiFieldRow(value_key, entries, ev) {
        ev.preventDefault();
        let clone = deepclone([this.metadata]);
        let field = get([clone, value_key]);
        let new_row = [];
        entries.forEach((entry) => {
            let new_column = {};
            new_column = set([new_column, entry.value_key, '']);
            new_row.push(new_column);
        });
        field.push(new_row);
        this.metadata = clone;
    }

    /**
     * Removes a row from a multi-row field.
     */
    public removeMultiFieldRow(value_key, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.metadata]);
        let field = get([clone, value_key]);
        field.splice(idx, 1);
        this.metadata = clone;
    }

    /**
     * Move a row in a multi-row field one row up.
     */
    public moveMultiFieldRowUp(value_key, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.metadata]);
        let field = get([clone, value_key]);
        let mover = field[idx];
        field.splice(idx, 1);
        field.splice(idx - 1, 0, mover);
        this.metadata = clone;
    }

    /**
     * Move a row in a multi-row field one row down.
     */
    public moveMultiFieldRowDown(value_key, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.metadata]);
        let field = get([clone, value_key]);
        let mover = field[idx];
        field.splice(idx, 1);
        field.splice(idx + 1, 0, mover);
        this.metadata = clone;
    }
}
