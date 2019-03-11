import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';

import { TEIParser } from './tei';

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

    public updateMetadata(metadata) {
        this.metadata = metadata;
    }
}
