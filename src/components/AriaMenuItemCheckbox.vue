<template>
  <li>
    <a role="menuitem" :tabindex="tabindex" @click="action" @keyup="keynav" :aria-checked="item.selected ? 'true' : 'false'">{{ item.label }}</a>
  </li>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AriaMenuItem from './AriaMenuItem.vue';


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
export default class AriaMenuItemCheckbox extends AriaMenuItem {
}
</script>
