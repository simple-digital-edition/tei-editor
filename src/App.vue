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
        let docElement = document.getElementById('TEIEditorDocument');
        if (docElement) {
            this.$store.commit('load', docElement.innerHTML);
        }
    }
}
</script>
