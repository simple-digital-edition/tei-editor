import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';

export default class IndividualAnnotationEditor extends Component {
    @tracked bodyText: object = null;
    @tracked displayedBodyText: object = null;
    @tracked selectedAnnotation: object = null;
    @tracked annotations: object = null;

    // Lifecycle events
    public didUpdate() {
        if (this.annotations !== this.args.annotations) {
            this.annotations = this.args.annotations;
            if (this.annotations && this.annotations.length > 0) {
                this.selectedAnnotation = this.annotations[0];
                this.bodyText = this.selectedAnnotation;
                this.displayedBodyText = this.selectedAnnotation;
            } else {
                this.selectedAnnotation = null;
            }
        }
    }

    // Action handlers

    /**
     * Event handler for when the user selects an annotation. Update the displayed annotation.
     */
    public selectAnnotation(ev) {
        ev.preventDefault();
        for(let idx = 0; idx < this.annotations.length; idx++) {
            if (this.annotations[idx].attrs.id === ev.target.value) {
                this.selectedAnnotation = this.annotations[idx];
                this.bodyText = this.selectedAnnotation;
                this.displayedBodyText = this.selectedAnnotation;
                break;
            }
        }
    }

    public updateAnnotationText(annotationText) {
        for(let idx = 0; idx < this.annotations.length; idx++) {
            if (this.annotations[idx].attrs.id === this.selectedAnnotation.attrs.id) {
                this.annotations[idx] = annotationText;
            }
        }
    }
}
