import Component from '@glimmer/component';

import deepclone from '../deepclone/helper';
import get from '../get/helper';
import set from '../set/helper';

export default class MetadataEditor extends Component {
    /**
     * Sets the content of a single value field, regardless whether it is an attribute or text. Also handles traversal
     * through array indices.
     */
    public setMetadataField(path, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        clone = set([clone, path, ev.target.value]);
        this.args.update(clone);
    }

    /**
     * Adds a row to a multi-row field.
     */
    public addMultiFieldRow(path, entries, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, path]);
        let new_row = [];
        entries.forEach((entry) => {
            let new_column = {};
            new_column = set([new_column, entry.path, '']);
            new_row.push(new_column);
        });
        field.push(new_row);
        this.args.update(clone);
    }

    /**
     * Removes a row from a multi-row field.
     */
    public removeMultiFieldRow(path, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, path]);
        field.splice(idx, 1);
        this.args.update(clone);
    }

    /**
     * Move a row in a multi-row field one row up.
     */
    public moveMultiFieldRowUp(path, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, path]);
        let mover = field[idx];
        field.splice(idx, 1);
        field.splice(idx - 1, 0, mover);
        this.args.update(clone);
    }

    /**
     * Move a row in a multi-row field one row down.
     */
    public moveMultiFieldRowDown(path, idx, ev) {
        ev.preventDefault();
        let clone = deepclone([this.args.metadata]);
        let field = get([clone, path]);
        let mover = field[idx];
        field.splice(idx, 1);
        field.splice(idx + 1, 0, mover);
        this.args.update(clone);
    }
}
