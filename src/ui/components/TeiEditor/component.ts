import Component from '@glimmer/component';

export default class TeiEditor extends Component {
    public setBlockAttribute(attribute, value, ev) {
        ev.preventDefault();
    }
}
