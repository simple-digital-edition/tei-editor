import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';

import { TEIParser } from './tei';
import deepclone from '../deepclone/helper';
import get from '../get/helper';
import set from '../set/helper';

export default class TeiEditor extends Component {
    //schema: Schema = null;
    @tracked currentView: string = '#tei-editor-main-text';
    @tracked loaded: boolean = false;
    @tracked bodyText: object = null;
    @tracked metadata: object = null;

    // Computed properties

    get mainTextEditorConfig() {
        return window.teiEditorConfig.schema;
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
                    component.bodyText = parser.body;
                    component.metadata = parser.metadata;
                    component.loaded = true;
                }
                reader.readAsText(files[0]);
            }
            fileSelector.remove();
        });
    }

    /**
     * Switch the active view.
     */
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
