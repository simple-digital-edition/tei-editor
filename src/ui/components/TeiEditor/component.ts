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
    view: EditorView = null;
    @tracked status: object = null;

    // Life-cycle handlers

    constructor(options: object) {
        super(options);
        this.schema = new Schema(window.teiEditorConfig.schema);
    }

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
        component.view = new EditorView(document.querySelector('#' + this.prosemirrorId), {
            state,
            dispatchTransaction(transaction) {
                let newState = component.view.state.apply(transaction);
                component.stateChange(newState);
                component.view.updateState(newState);
            }
        });
    }

    // Computed properties

    get prosemirrorId() {
        return 'teieditor-' + ensureGuid(this);
    }

    get sidebarConfig() {
        return window.teiEditorConfig.ui.sidebar;
    }

    // Action handlers

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

    public menuAction(action, attribute, value, ev) {
        this.view.focus();
        if (value === 'ev.target.value') {
            value = ev.target.value;
        }
        if (action === 'setBlockType') {
            setBlockType(this.schema.nodes[value], {})(this.view.state, this.view.dispatch)
        } else if (action === 'setBlockAttribute') {
            let {$from} = this.view.state.selection;
            let attrs = Object.assign({}, $from.parent.attrs);
            attrs[attribute] = value;
            setBlockType(this.schema.nodes[$from.parent.type.name], attrs)(this.view.state, this.view.dispatch)
        } else if (action === 'toggleBlockAttribute') {
            let {$from} = this.view.state.selection;
            let attrs = Object.assign({}, $from.parent.attrs);
            attrs[attribute] = !attrs[attribute];
            setBlockType(this.schema.nodes[$from.parent.type.name], attrs)(this.view.state, this.view.dispatch);
        } else if (action === 'setMarkAttribute') {
            attribute = attribute.split('.');
            let marks = getMarks(this.view.state);
            let {$from, $to} = this.view.state.selection
            let transaction = this.view.state.tr;
            transaction.removeMark($from.pos, $to.pos, this.schema.marks[attribute[0]]);
            if (value && value.trim() !== '') {
                let attrs = {}
                attrs[attribute[1]] = value;
                transaction.addMark($from.pos, $to.pos, this.schema.marks[attribute[0]].create(attrs));
            }
            this.view.dispatch(transaction);
        } else if (action === 'toggleMark') {
            toggleMark(this.schema.marks[attribute])(this.view.state, this.view.dispatch);
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
                    component.view.updateState(state);
                }
                reader.readAsText(files[0]);
            }
            fileSelector.remove();
        });
    }
}
