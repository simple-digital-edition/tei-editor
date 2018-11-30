import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';
import {baseKeymap, setBlockType, toggleMark} from 'prosemirror-commands';
import {undo, redo, history} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';
import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import config from '../config';

export default class Prosemirror extends Component implements HasGuid {
    _guid: number = null;
    schema: Schema = null;
    view: EditorView = null;

    get id() {
        return 'prosemirror-' + ensureGuid(this);
    }

    constructor(options: object) {
        super(options);
        this.schema = new Schema(config.schema );
    }

    didInsertElement() {
        let doc = null;
        if (this.args.document !== null) {
            doc = this.schema.nodeFromJSON(this.args.document);
        }

        let state = EditorState.create({
            schema: this.schema,
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
        let component = this;
        component.view = new EditorView(document.querySelector('#' + this.id), {
            state,
            dispatchTransaction(transaction) {
                let new_state = component.view.state.apply(transaction);
                component.args.stateChange(new_state);
                component.view.updateState(new_state);
            }
        });
    }

    didUpdate() {
        let doc = null;
        if (this.args.document !== null) {
            doc = this.schema.nodeFromJSON(this.args.document);
        }
        let state = EditorState.create({
            schema: this.schema,
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
        this.view.updateState(state);
    }
}
