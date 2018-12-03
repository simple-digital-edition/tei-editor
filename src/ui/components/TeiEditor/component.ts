import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';
import {baseKeymap, setBlockType, toggleMark} from 'prosemirror-commands';
import {undo, redo, history} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';
import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import { TEIParser } from './tei';
import config from '../config';

export default class TeiEditor extends Component implements HasGuid {
    _guid: number = null;
    schema: Schema = null;
    view: EditorView = null;

    // Life-cycle handlers

    constructor(options: object) {
        super(options);
        this.schema = new Schema(config.schema);
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
                let new_state = component.view.state.apply(transaction);
                component.view.updateState(new_state);
            }
        });
    }

    // Computed properties

    get prosemirrorId() {
        return 'teieditor-' + ensureGuid(this);
    }

    // Action handlers
    
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
                    let parser = new TEIParser(ev.target.result);
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
