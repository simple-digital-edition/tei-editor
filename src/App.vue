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
export default class App extends Vue {
    public mounted() {
        let configElement = document.getElementById('TEIEditorConfig');
        if (configElement) {
            let config = JSON.parse(configElement.innerHTML);
            if (config) {
                this.$store.commit('init', config);
            }
        }
        if (this.$store.state.callbacks && this.$store.state.callbacks.autoLoad) {
            this.$store.state.callbacks.autoLoad((sourceData: string) => {
                this.$store.dispatch('load', sourceData);
            });
        }
    }
}
</script>
