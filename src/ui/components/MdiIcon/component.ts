import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';
import * as icons from '@mdi/js';

export default class MdiIcon extends Component {
    @tracked private icon: string;
    private class: string = 'mdi';

    constructor(options: object) {
        super(options);
        let name = options.args.name;
        if (icons['mdi' + name]) {
            this.icon = icons['mdi' + name];
        }
        if (options.args.class) {
            this.class = 'mdi ' + options.args.class;
        }
    }
}
