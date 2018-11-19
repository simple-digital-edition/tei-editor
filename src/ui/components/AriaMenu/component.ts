import Component from '@glimmer/component';

export default class AriaMenu extends Component {
    /**
     * Handle the key-down event and implement the navigation through the menu
     */
    private keyDown(ev) {
        if (ev.keyCode === 39) {
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
}
