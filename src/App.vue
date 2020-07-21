<template>
  <div id="app">
    <tei-editor v-if="config" :config="config" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TeiEditor from "./components/TeiEditor.vue";
import { Config } from "@/interfaces";

@Component({
    components: {
        TeiEditor
    }
})
export default class App extends Vue {
    public config = null as Config | null;

    public mounted() {
        const configElement = document.getElementById('TEIEditorConfig');
        if (configElement) {
            const config = JSON.parse(configElement.innerHTML);
            if (config) {
                this.config = config;
            }
        }
    }
}
</script>
