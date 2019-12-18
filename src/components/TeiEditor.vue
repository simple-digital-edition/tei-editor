<template>
  <div>
    <nav>
      <aria-menubar :items="menuItems" @action="menuAction" />
    </nav>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AriaMenubar from './AriaMenubar.vue';

@Component({
    components: {
      AriaMenubar,
    },
    mounted() {
    },
})
export default class TeiEditor extends Vue {
  menuItems = [
    {
      label: 'File',
      children: [
        {
          label: 'Save',
          action: 'save',
        }
      ],
    },
    {
      label: 'Metadaten',
      action: 'metadata',
    },
    {
      label: 'Haupttext',
      action: 'haupttext'
    }
  ];

  menuAction(name: string) {
    console.log(name);
  }
}
</script>
