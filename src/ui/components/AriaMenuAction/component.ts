import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';

export default class AriaMenuAction extends Component {
    @tracked
    get tabindex() {
        if (this.args.tabindex !== undefined) {
            return this.args.tabindex;
        } else {
            return -1;
        }
    }

    public noAction(ev) {
        ev.preventDefault();
    }
}
