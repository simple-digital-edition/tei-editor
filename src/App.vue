<template>
  <div id="app">
    <tei-editor />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TeiEditor from "./components/TeiEditor.vue";

@Component({
  components: {
    TeiEditor
  }
})
export default class App extends Vue {}
</script>
