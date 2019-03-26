import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';

import { TEIParser, TEISerializer } from './tei';

export default class TeiEditor extends Component {
    //schema: Schema = null;
    @tracked currentView: string = '#tei-editor-main-text';
    @tracked loaded: boolean = false;
    @tracked mainText: object = null;
    @tracked displayedMainText: object = null;
    @tracked globalAnnotationText: object = null;
    @tracked displayedGlobalAnnotationText: object = null;
    @tracked metadata: object = null;
    @tracked individualAnnotations: object = null;

    // Computed properties

    /**
     * Return the main text schema.
     */
    get mainTextEditorConfig() {
        return window.teiEditorConfig.schema.mainText;
    }

    /**
     * Return the main text sidebar configuration.
     */
    get mainTextSidebarConfig() {
        return window.teiEditorConfig.ui.mainText.sidebar;
    }

    /**
     * Return the main text schema.
     */
    get globalAnnotationConfig() {
        return window.teiEditorConfig.schema.globalAnnotations;
    }

    /**
     * Return the main text sidebar configuration.
     */
    get globalAnnotationSidebarConfig() {
        return window.teiEditorConfig.ui.globalAnnotations.sidebar;
    }

    /**
     * Return the individual annotations schema.
     */
    get individualAnnotationsConfig() {
        return window.teiEditorConfig.schema.individualAnnotations;
    }

    /**
     * Return the individual annotations sidebar config.
     */
    get individualAnnotationsSidebarConfig() {
        return window.teiEditorConfig.ui.individualAnnotations.sidebar;
    }

    /**
     * Return the metadata configuration.
     */
    get metadataConfig() {
        return window.teiEditorConfig.ui.metadata;
    }

    /**
     * Returns the default document for individual annotations.
     */
    get individualAnnotationsDefault() {
        return window.teiEditorConfig.default.individualAnnotations;
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
                    let parser = new TEIParser(ev.target.result, window.teiEditorConfig.parser);
                    component.mainText = parser.body;
                    component.displayedMainText = parser.body;
                    component.metadata = parser.metadata;
                    component.globalAnnotationText = parser.globalAnnotationText;
                    component.displayedGlobalAnnotationText = parser.globalAnnotationText;
                    component.individualAnnotations = parser.individualAnnotations;
                    component.loaded = true;
                }
                reader.readAsText(files[0]);
            }
            fileSelector.remove();
        });
    }

    public saveFile(ev) {
        ev.preventDefault();
        let serializer = new TEISerializer(window.teiEditorConfig.serializer);
        let content = serializer.serialize(this.metadata, this.mainText, this.globalAnnotationText, this.individualAnnotations);
        let blob = new Blob([content], {type: 'text/xml;charset=utf-8'});
        let link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'download.tei');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    public updateMainText(mainText) {
        this.mainText = mainText;
    }

    public updateGlobalAnnotationText(globalAnnotationText) {
        this.globalAnnotationText = globalAnnotationText;
    }

    public updateMetadata(metadata) {
        this.metadata = metadata;
    }

    public updateIndividualAnnotations(individualAnnotations) {
        this.individualAnnotations = individualAnnotations;
    }
}
