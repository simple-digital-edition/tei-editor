<template>
  <li>
    <span v-if="item.disabled" role="menuitem" aria-disabled="true" v-html="item.label"></span>
    <a v-else role="menuitem" :tabindex="tabindex" @click="action" @keyup="keynav" v-html="item.label"></a>
  </li>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
    props: {
        tabindex: {
            type: Number,
            default: -1,
        },
        item: {
            type: Object
        },
    },
})
export default class AriaMenuItem extends Vue {
    action() {
        if (this.$props.item.action) {
            this.$emit('action', this.$props.item.action);
        }
    }

    keynav(ev:KeyboardEvent) {
        if (ev.keyCode === 37 || ev.keyCode == 38) {
            let parentElement = (ev.target as Element).parentElement;
            while (parentElement) {
                parentElement = (parentElement.previousElementSibling as HTMLElement);
                if (parentElement) {
                    for (let idx = 0; idx < parentElement.children.length; idx++) {
                        if (parentElement.children[idx].getAttribute('role') === 'menuitem' && parentElement.children[idx].getAttribute('aria-disabled') !== 'true') {
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
                        if (parentElement.children[idx].getAttribute('role') === 'menuitem' && parentElement.children[idx].getAttribute('aria-disabled') !== 'true') {
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
            this.action();
        }
    }
}
</script>
