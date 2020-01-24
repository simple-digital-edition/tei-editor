<template>
  <div class="metadata-editor">
    <section v-for="(section, idx) in config.ui" :key="idx">
      <h2>{{ section.label }}</h2>
      <div v-for="(entry, idx2) in section.entries" :key="idx2">
        <metadata-field :config="entry"/>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MetadataField from './MetadataField.vue';

@Component({
    components: {
        MetadataField,
    },
    props: {
        config: Object,
    }
})
export default class MetadataEditor extends Vue {
}
</script>
