import Component from '@glimmer/component';
import { tracked } from '@glimmer/component';

export default class AriaDropdownMenu extends Component {
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
        } else if (ev.keyCode === 27) {
            if (ev.target.getAttribute('aria-haspopup') !== 'true') {
                ev.target.parentElement.parentElement.previousElementSibling.focus();
            }
            this.expanded = 'false';
        } else if (ev.keyCode === 39) {
            let nextElement = ev.target.parentElement.nextElementSibling;
            while (nextElement && (nextElement.getAttribute('role') === 'separator' ||
                   nextElement.querySelector('*[role="menuitem"]').getAttribute('aria-disabled') === 'true')) {
                nextElement = nextElement.nextElementSibling;
            }
            if (nextElement) {
                nextElement.querySelector('*[role="menuitem"]').focus();
            }
        } else if (ev.keyCode === 37) {
            let previousElement = ev.target.parentElement.previousElementSibling;
            while (previousElement && (previousElement.getAttribute('role') === 'separator' ||
                   previousElement.querySelector('*[role="menuitem"]').getAttribute('aria-disabled') === 'true')) {
                previousElement = previousElement.previousElementSibling;
            }
            if (previousElement) {
                previousElement.querySelector('*[role="menuitem"]').focus();
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
