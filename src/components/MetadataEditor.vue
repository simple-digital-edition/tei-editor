<template>
  <div>
     {{ config.ui }}
    <section v-for="(section, idx) in config.ui" :key="idx">
      <h2>{{ section.label }}</h2>
      <div v-for="(entry, idx2) in section.entries" :key="idx2">
        <input/>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
    props: {
        config: Object
    }
})
export default class MetadataEditor extends Vue {
}
</script>
