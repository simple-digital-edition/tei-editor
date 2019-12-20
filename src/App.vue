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
        this.$store.commit('init', {
            sections: {
                metadaten: {
                    label: 'Metadaten',
                    type: 'MetadataEditor',
                },
                haupttext: {
                    label: 'Haupttext',
                    type: 'TextEditor',
                },
                apparat: {
                    label: 'Apparat',
                    type: 'TextEditor',
                },
            },
        });
    }
}
</script>
