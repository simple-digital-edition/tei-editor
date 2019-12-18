<template>
  <ul role="menubar">
    <template v-for="(item, index) in items">
      <aria-menu v-if="item.children" :key="index" :item="item" @action="action" :tabindex="index === 0 ? 0 : -1" />
      <aria-menu-item v-else :key="index" :item="item" @action="action" :tabindex="index === 0 ? 0 : -1" />
    </template>
  </ul>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { MenuItemConfig } from '@/interfaces';
import AriaMenuItem from './AriaMenuItem.vue';
import AriaMenu from './AriaMenu.vue';


@Component({
    components: {
        AriaMenuItem,
        AriaMenu,
    },
    props: {
        items: {
            type: Array,
        },
    },
})
export default class AriaMenubar extends Vue {
    action(name: string) {
        this.$emit('action', name);
    }
}
</script>

<style module lang="scss">
  ul[role='menubar'] {
    margin: 0;
    padding: 0;
    position: relative;

    li {
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
          display: block;
          position: absolute;
        }
    }
  }
</style>
