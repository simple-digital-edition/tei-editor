<template>
  <li>
    <a role="menuitem" :tabindex="tabindex" :aria-expanded="expanded" @click="toggle" @keyup="keynav">{{ item.label }}</a>
    <ul role="menu" :aria-hidden="hidden" @keyup="keynav">
      <template v-for="(item, index) in item.children">
        <aria-menu v-if="item.children" :key="index" :item="item" @action="action" />
        <template v-else>
          <aria-menu-item-checkbox v-if="item.selected !== undefined" :key="index" :item="item" @action="action" />
          <aria-menu-item v-else :key="index" :item="item" @action="action" />
        </template>
      </template>
    </ul>
  </li>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AriaMenuItem from './AriaMenuItem.vue';
import AriaMenuItemCheckbox from './AriaMenuItemCheckbox.vue';

@Component({
    components: {
        AriaMenuItem,
        AriaMenuItemCheckbox,
    },
    props: {
        tabindex: {
            type: Number,
            default: -1
        },
        item: {
            type: Object,
        },
  },
})
export default class AriaMenu extends Vue {
    hidden = 'true';

    toggle(ev:any) {
        if (this.hidden === 'true') {
            this.hidden = 'false';
        } else {
            this.hidden = 'true';
        }
    }

    action(name: string) {
        this.$emit('action', name);
        this.hidden = 'true';
    }

    keynav(ev:KeyboardEvent) {
        if (ev.keyCode === 37 || ev.keyCode === 38) {
            let parentElement = (ev.target as Element).parentElement;
            while (parentElement) {
                parentElement = (parentElement.previousElementSibling as HTMLElement);
                if (parentElement) {
                    for (let idx = 0; idx < parentElement.children.length; idx++) {
                        if (parentElement.children[idx].getAttribute('role') === 'menuitem') {
                            (parentElement.children[idx] as HTMLElement).focus();
                            parentElement = null;
                            ev.preventDefault();
                            ev.stopPropagation();
                            break;
                        }
                    }
                }
            }
        } else if (ev.keyCode == 39 || ev.keyCode == 40) {
            let parentElement = (ev.target as Element).parentElement;
            while (parentElement) {
                parentElement = (parentElement.nextElementSibling as HTMLElement);
                if (parentElement) {
                    for (let idx = 0; idx < parentElement.children.length; idx++) {
                        if (parentElement.children[idx].getAttribute('role') === 'menuitem') {
                            (parentElement.children[idx] as HTMLElement).focus();
                            parentElement = null;
                            ev.preventDefault();
                            ev.stopPropagation();
                            break;
                        }
                    }
                }
            }
        } else if (ev.keyCode === 13) {
            if (this.hidden === 'true') {
                this.hidden = 'false';
                let childFirstItem = (ev.target as Element).nextElementSibling;
                if (childFirstItem) {
                    childFirstItem = childFirstItem.querySelector("li > [role='menuitem']");
                    if (childFirstItem) {
                        this.$nextTick(() => {
                            (childFirstItem as HTMLElement).focus();
                        });
                    }
                }
            } else {
                this.hidden = 'true';
            }
        } else if (ev.keyCode === 27) {
            this.hidden = 'true';
        }
    }

    public get expanded() {
        if (this.hidden === 'true') {
            return 'false';
        } else {
            return true;
        }
    }
}
</script>
