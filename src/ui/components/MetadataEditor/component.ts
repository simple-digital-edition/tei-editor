import Component from '@glimmer/component';

import deepclone from '../deepclone/helper';
import get from '../get/helper';
import set from '../set/helper';

export default class MetadataEditor extends Component {
    /**
     * Sets the content of a single value field, regardless whether it is an attribute or text. Also handles traversal
     * through array indices.
     */
    public setMetadataField(value_key, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        clone = set([clone, value_key, ev.target.value]);
        this.args.update(clone);
    }

    /**
     * Adds a row to a multi-row field.
     */
    public addMultiFieldRow(value_key, entries, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, value_key]);
        let new_row = [];
        entries.forEach((entry) => {
            let new_column = {};
            new_column = set([new_column, entry.value_key, '']);
            new_row.push(new_column);
        });
        field.push(new_row);
        console.log(this.args.update);
        this.args.update(clone);
    }

    /**
     * Removes a row from a multi-row field.
     */
    public removeMultiFieldRow(value_key, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, value_key]);
        field.splice(idx, 1);
        this.args.update(clone);
    }

    /**
     * Move a row in a multi-row field one row up.
     */
    public moveMultiFieldRowUp(value_key, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, value_key]);
        let mover = field[idx];
        field.splice(idx, 1);
        field.splice(idx - 1, 0, mover);
        this.args.update(clone);
    }

    /**
     * Move a row in a multi-row field one row down.
     */
    public moveMultiFieldRowDown(value_key, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, value_key]);
        let mover = field[idx];
        field.splice(idx, 1);
        field.splice(idx + 1, 0, mover);
        this.args.update(clone);
    }
}
