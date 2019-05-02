import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import { ensureGuid, HasGuid } from '@glimmer/util';

import { TEIParser, TEISerializer } from './tei';

import deepclone from '../deepclone/helper';

export default class TeiEditor extends Component {
    //schema: Schema = null;
    @tracked loaded: boolean = false;
    @tracked sections: object = null;
    @tracked data: object = null;
    @tracked currentView: string = '';

    constructor(options) {
        super(options);
        this.sections = deepclone([window.teiEditorConfig.sections]);
        this.currentView = Object.keys(this.sections)[0];
    }

    public didInsertElement() {
        if (window.teiEditorConfig.actions && window.teiEditorConfig.actions.initLoad) {
            let component = this;
            window.teiEditorConfig.actions.initLoad().then(function(data) {
                let parser = new TEIParser(data, window.teiEditorConfig.sections);
                data = {};
                Object.keys(window.teiEditorConfig.sections).forEach((key) => {
                    data[key] = parser.get(key);
                });
                component.data = data;
                component.loaded = true;
            });
        }
    }

    // Computed properties

    /**
     * Returns the main UI config
     */
    get mainUIConfig() {
        return window.teiEditorConfig.ui.main;
    }

    /**
     * Returns a dictionary of all loaded multi-texts.
     */
    @tracked get multiTexts() {
        let multiTexts = {};
        if (this.sections && this.data) {
            Object.entries(this.sections).forEach((entry) => {
                if (entry[1].type === 'multi-text' && this.data && this.data[entry[0]]) {
                    multiTexts[entry[0]] = this.data[entry[0]];
                }
            });
        }
        return multiTexts;
    }

    // Action handlers

    public loadFile(ev) {
        ev.preventDefault();
        let component = this;
        if (window.teiEditorConfig.actions && window.teiEditorConfig.actions.load) {
            window.teiEditorConfig.actions.load().then(function(data) {
                let parser = new TEIParser(data, window.teiEditorConfig.parser);
                component.mainText = parser.body;
                component.displayedMainText = parser.body;
                component.metadata = parser.metadata;
                component.globalAnnotationText = parser.globalAnnotationText;
                component.displayedGlobalAnnotationText = parser.globalAnnotationText;
                component.individualAnnotations = parser.individualAnnotations;
                component.loaded = true;
            });
        } else {
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
    }

    public saveFile(ev) {
        ev.preventDefault();
        let serializer = new TEISerializer();
        console.log(serializer.serialize(this.data, this.sections));
        /*let serializer = new TEISerializer(window.teiEditorConfig.serializer);
        let content = serializer.serialize(this.metadata, this.mainText, this.globalAnnotationText, this.individualAnnotations);
        if (window.teiEditorConfig.actions && window.teiEditorConfig.actions.save) {
            window.teiEditorConfig.actions.save(content);
        } else {
            let blob = new Blob([content], {type: 'text/xml;charset=utf-8'});
            let link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', 'download.tei');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }*/
    }

    /**
     * Switch the active view.
     */
    public setView(view, ev) {
        ev.preventDefault();
        this.currentView = view;
    }

    public updateData(key, data) {
        let newData = deepclone([this.data]);
        newData[key] = data;
        this.data = newData;
    }
}
