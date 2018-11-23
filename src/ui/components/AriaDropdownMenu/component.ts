import Component from '@glimmer/component';
import AriaMenu from '../AriaMenu/component';
import { tracked } from '@glimmer/component';

export default class AriaDropdownMenu extends AriaMenu {
    @tracked expanded: string = 'false';

    private click(ev) {
        ev.preventDefault();
        if (this.expanded === 'false') {
            this.expanded = 'true';
        } else {
            this.expanded = 'false';
        }
    }

    private keyDown(ev) {
        if (ev.keyCode === 13) {
            if (this.expanded === 'false') {
                this.expanded = 'true';
                setTimeout(function() {
                    ev.target.nextElementSibling.querySelector('*[role="menuitem"]').focus();
                }, 100);
            } else {
                this.expanded = 'false';
            }
        }
    }

    private mouseOver() {
        this.expanded = 'true';
    }

    private mouseOut() {
        this.expanded = 'false';
    }
}
