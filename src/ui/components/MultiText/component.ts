import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';

import deepclone from '../deepclone/helper';

export default class MultiText extends Component {
    @tracked texts: object[] = null;
    @tracked selectedIdx: number = null;
    @tracked text: object = null;

    // Lifecycle events

    public didUpdate() {
        if (this.texts !== this.args.texts) {
            this.texts = this.args.texts;
            if (this.texts && this.texts.length > 0) {
                if (this.selectedIdx !== null) {
                    if (this.selectedIdx >= 0 && this.selectedIdx < this.texts.length) {
                        this.text = this.texts[this.selectedIdx].text;
                    } else {
                        if (this.texts && this.texts.length > 0) {
                            this.selectedIdx = 0;
                            this.text = this.texts[this.selectedIdx].text;
                        } else {
                            this.selectedIdx = null;
                            this.text = null;
                        }
                    }
                } else {
                    this.selectedIdx = 0;
                    this.text = this.texts[this.selectedIdx].text;
                }
            } else {
                this.selectedIdx = null;
                this.text = null;
            }
        }
    }

    // Action handlers

    /**
     * Event handler for when the user selects a text. Update the displayed text.
     */
    public selectText(ev) {
        ev.preventDefault();
        this.selectedIdx = Number.parseInt(ev.target.value);
        this.text = this.texts[this.selectedIdx].text;
    }

    /**
     * Update a text
     */
    public updateText(updatedText) {
        this.texts[this.selectedIdx] = {
            id: updatedText.attrs.id,
            text: updatedText
        };
        this.text = updatedText;
        this.args.update(this.texts);
    }

    /**
     * Delete the currently selected text
     */
    public deleteText() {
        let texts = deepclone([this.texts]);
        console.log(this.selectedIdx);
        texts.splice(this.selectedIdx, 1);
        this.args.update(texts);
    }

    /**
     * Add a new text
     */
    public addText() {
        let texts = deepclone([this.texts]);
        let newIdx = 0;
        let exists = true;
        while (exists) {
            exists = false;
            newIdx = newIdx + 1;
            for (let idx = 0; idx < texts.length; idx++) {
                if (texts[idx].id === 'new-text-' + newIdx) {
                    exists = true;
                    break;
                }
            }
        }
        texts.push({
            id: 'new-text-' + newIdx,
            text: deepclone([this.args.default])
        });
        this.selectedIdx = texts.length - 1;
        this.text = texts[this.selectedIdx].text;
        this.args.update(texts);
    }
}
