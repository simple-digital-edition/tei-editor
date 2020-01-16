<script lang="ts">
import { Component } from 'vue-property-decorator';
import AriaMenubar from './AriaMenubar.vue';

@Component({
})
export default class AriaMenu extends AriaMenubar {
    public render() {
        if (this.$scopedSlots.default) {
            return this.$scopedSlots.default({
                keyboardNav: this.keyboardNavigation,
                mouseClickNav: this.mouseClickNavigation,
            });
        }
    }

    public keyboardNavigation(ev: KeyboardEvent) {
        let target = ev.target as HTMLElement;
        if (target) {
            if (ev.keyCode === 39) {
            } else if (ev.keyCode === 37) {
            } else if (ev.keyCode === 38) {
                let next = this.findNextMenuitem(this.getParentMenu(target), target, 'previous');
                if (next) {
                    next.focus();
                }
            } else if (ev.keyCode === 40) {
                let next = this.findNextMenuitem(this.getParentMenu(target), target, 'next');
                if (next) {
                    next.focus();
                }
            } else if (ev.keyCode === 13 || ev.keyCode == 32) {
                if (target.getAttribute('aria-expanded')) {
                    // @ts-ignore
                    for (const element of target.parentElement.children) {
                        if (element.getAttribute('role') === 'menu') {
                            if (element.getAttribute('aria-hidden') === 'false') {
                                element.setAttribute('aria-hidden', 'true');
                                target.setAttribute('aria-expanded', 'false');
                            } else {
                                element.setAttribute('aria-hidden', 'false');
                                target.setAttribute('aria-expanded', 'true');
                                let next = this.findNextMenuitem(element as HTMLElement, null, 'next');
                                if (next) {
                                    next.focus();
                                }
                            }
                        }
                    }
                } else {
                    target.click();
                }
            } else if (ev.keyCode === 27) {
                let parentMenu = this.getParentMenu(target);
                if (parentMenu) {
                    parentMenu.setAttribute('aria-hidden', 'true');
                    // @ts-ignore
                    for (const element of parentMenu.parentElement.children) {
                        if (element.getAttribute('role') === 'menuitem') {
                            element.setAttribute('aria-expanded', 'false');
                            (element as HTMLElement).focus();
                        }
                    }
                }
            }
        }
    }

    public mouseClickNavigation(ev: MouseEvent) {
        let target = ev.target as HTMLElement;
        if (target) {
            if (target.getAttribute('aria-expanded')) {
                // @ts-ignore
                for (const element of target.parentElement.children) {
                    if (element.getAttribute('role') === 'menu') {
                        if (element.getAttribute('aria-hidden') === 'false') {
                            element.setAttribute('aria-hidden', 'true');
                            target.setAttribute('aria-expanded', 'false');
                        } else {
                            element.setAttribute('aria-hidden', 'false');
                            target.setAttribute('aria-expanded', 'true');
                            let next = this.findNextMenuitem(element as HTMLElement, null, 'next');
                            if (next) {
                                next.focus();
                            }
                        }
                    }
                }
            } else {
                let parentMenu = this.getParentMenu(target);
                if (parentMenu) {
                    parentMenu.setAttribute('aria-hidden', 'true');
                    // @ts-ignore
                    for (const element of parentMenu.parentElement.children) {
                        if (element.getAttribute('role') === 'menuitem') {
                            element.setAttribute('aria-expanded', 'false');
                            (element as HTMLElement).focus();
                        }
                    }
                }
            }
        }
    }

    protected getParentMenu(element: HTMLElement): HTMLElement | null {
        if (!element) {
            return null;
        } else if (element.getAttribute('role') === 'menu') {
            return element;
        } else {
            return this.getParentMenu(element.parentElement as HTMLElement);
        }
    }

    protected getParentMenuOrMenubar(element: HTMLElement): HTMLElement | null {
        if (!element) {
            return null;
        } else if (element.getAttribute('role') === 'menu' || element.getAttribute('role') === 'menubar') {
            return element;
        } else {
            return this.getParentMenuOrMenubar(element.parentElement as HTMLElement);
        }
    }
}
</script>
