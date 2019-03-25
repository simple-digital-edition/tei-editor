import { Step, StepResult } from 'prosemirror-transform';

export default class SetDocAttr extends Step {
    constructor(key: string, value: any, stepType?: string = 'SetDocAttr') {
        super();
        this.stepType = stepType;
        this.key = key;
        this.value = value;
    }

    apply(doc) {
        this.prevValue = doc.attrs[this.key];
        doc.attrs[this.key] = this.value;
        return StepResult.ok(doc);
    }

    invert() {
        return new SetDocAttr(this.key, this.prevValue, 'revertSetDocAttr');
    }

    map() {
        return null;
    }

    toJSON() {
        return {
            stepType: this.stepType,
            key: this.key,
            value: this.value,
        };
    }

    static fromJSON(json) {
        return new SetDocAttr(json.key, json.value, json.stepType);
    }
}
