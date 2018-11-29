import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import * as icons from '@mdi/js';

export default class MdiIcon extends Component {
    @tracked
    get icon() {
        return icons['mdi' + this.args.name];
    }

    @tracked
    get class() {
        if (this.args.class !== undefined) {
            return 'mdi ' + this.args.class;
        } else {
            return 'mdi';
        }
    }
}
