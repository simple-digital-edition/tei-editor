import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';

import deepclone from '../deepclone/helper';

export default class IndividualAnnotationEditor extends Component {
    @tracked bodyText: object = null;
    @tracked selectedAnnotation: object = null;
    @tracked selectedId: string = null;
    @tracked annotations: object = null;
    nextAnnotationId: number = 0;

    // Lifecycle events
    public didUpdate() {
        if (this.annotations !== this.args.annotations) {
            this.annotations = this.args.annotations;
            if (this.annotations && this.annotations.length > 0) {
                if (this.selectedId) {
                    for (let idx = 0; idx < this.annotations.length; idx++) {
                        if (this.annotations[idx].attrs.id === this.selectedId) {
                            this.bodyText = this.annotations[idx];
                            break
                        }
                    }
                } else {
                    this.bodyText = this.annotations[0];
                    console.log(this.bodyText);
                    this.selectedId = this.annotations[0].attrs.id;
                }
            } else {
                this.bodyText = null;
                this.selectedId = null;
            }
        }
    }

    // Action handlers

    /**
     * Event handler for when the user selects an annotation. Update the displayed annotation.
     */
    public selectAnnotation(ev) {
        ev.preventDefault();
        this.selectedId = ev.target.value;
        for(let idx = 0; idx < this.annotations.length; idx++) {
            if (this.annotations[idx].attrs.id === this.selectedId) {
                this.bodyText = this.annotations[idx];
                break;
            }
        }
    }

    /**
     * Update the text of an annotation
     */
    public updateAnnotationText(annotationText) {
        for(let idx = 0; idx < this.annotations.length; idx++) {
            if (this.annotations[idx].attrs.id === annotationText.attrs.id) {
                if (annotationText.attrs.id !== this.selectedId) {
                    let annotations = this.annotations.slice();
                    annotations[idx] = annotationText;
                    this.selectedId = annotationText.attrs.id;
                    this.args.update(annotations);
                    break
                } else {
                    this.annotations[idx] = annotationText;
                }
            }
        }
    }

    /**
     * Delete the currently selected annotation
     */
    public deleteAnnotation() {
        for(let idx = 0; idx < this.annotations.length; idx++) {
            if (this.annotations[idx].attrs.id === this.selectedAnnotation.attrs.id) {
                let annotations = this.annotations.slice();
                annotations.splice(idx, 1);
                this.args.update(annotations);
                break;
            }
        }
    }

    /**
     * Add a new annotation
     */
    public addAnnotation() {
        let annotations = this.annotations.slice();
        let defaultDoc = deepclone([this.args.default]);
        this.nextAnnotationId++;
        defaultDoc.attrs.id = 'new' + this.nextAnnotationId;
        annotations.push(defaultDoc);
        this.selectedId = 'new' + this.nextAnnotationId;
        this.args.update(annotations);
    }
}
