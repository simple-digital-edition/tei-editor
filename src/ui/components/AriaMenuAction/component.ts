import Component from '@glimmer/component';

export default class AriaMenuAction extends Component {
    private tabindex: number = -1;

    constructor(options: object) {
        super(options);
        if (options.args.tabindex !== undefined) {
            this.tabindex = options.args.tabindex;
        }
    }
}
