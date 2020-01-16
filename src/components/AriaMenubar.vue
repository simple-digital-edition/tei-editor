<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';


@Component({
})
export default class AriaMenubar extends Vue {
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
                let next = this.findNextMenuitem(this.getParentMenubar(target), target, 'next');
                if (next) {
                    next.focus();
                }
            } else if (ev.keyCode === 37) {
                let next = this.findNextMenuitem(this.getParentMenubar(target), target, 'previous');
                if (next) {
                    next.focus();
                }
            } else if (ev.keyCode === 38 || ev.keyCode === 40) {
                // @ts-ignore
                for (const element of target.parentElement.children) {
                    if (element.getAttribute('role') === 'menu') {
                        element.setAttribute('aria-hidden', 'false');
                        target.setAttribute('aria-expanded', 'true');
                        let next = this.findNextMenuitem(element as HTMLElement, null, 'next');
                        if (next) {
                            next.focus();
                        }
                    }
                }
            } else if (ev.keyCode === 13 || ev.keyCode == 32) {
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
                                return;
                            }
                        }
                    }
                }
                target.click();
            }
        }
    }

    public mouseClickNavigation(ev: MouseEvent) {
        let target = ev.target as HTMLElement;
        if (target) {
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
                            return;
                        }
                    }
                }
            }
        }
    }

    protected getParentMenubar(element: HTMLElement): HTMLElement | null {
        if (!element) {
            return null;
        } else if (element.getAttribute('role') === 'menubar') {
            return element;
        } else {
            return this.getParentMenubar(element.parentElement as HTMLElement);
        }
    }

    protected findNextMenuitem(root: HTMLElement | null, start: HTMLElement | null, direction: string) {
        if (!root) {
            return null;
        }
        let stack = [] as HTMLElement[];
        if (direction === 'next') {
            for (let idx = root.children.length - 1; idx >= 0; idx--) {
                stack.push(root.children[idx] as HTMLElement);
            }
        } else {
            for (let idx = 0; idx < root.children.length; idx++) {
                stack.push(root.children[idx] as HTMLElement);
            }
        }
        let mode = 0;
        if (!start) {
            mode = 1;
        }
        while (stack.length > 0) {
            let current = stack.pop() as HTMLElement;
            if (mode === 0 && current === start) {
                mode = 1;
            } else if (mode === 1 && current.getAttribute('role') === 'menuitem' && current.getAttribute('aria-disabled') !== 'true') {
                return current;
            }
            if (current.getAttribute('role') !== 'menu') {
                if (direction === 'next') {
                    for (let idx = current.children.length - 1; idx >= 0; idx--) {
                        stack.push(current.children[idx] as HTMLElement);
                    }
                } else {
                    for (let idx = 0; idx < current.children.length; idx++) {
                        stack.push(current.children[idx] as HTMLElement);
                    }
                }
            }
        }
        return null;
    }
}
</script>

<style module lang="scss">
  ul[role='menubar'] {
    margin: 0;
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: row;

    li {
      flex: 0 0 auto;
      display: inline-block;
      vertical-align: top;

      a {
        cursor: pointer;
      }
    }

    *[aria-hidden='true'] {
      display: none;
    }

    ul[role='menu'] {
        margin: 0;
        padding: 0;

        &[aria-hidden='false'] {
          display: flex;
          flex-direction: column;
          position: absolute;
        }
    }
  }
</style>
