<template>
  <div id="app">
    <tei-editor v-if="config" :config="config" :autoLoadCallback="autoLoad" :loadCallback="load" @save="save"/>
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

    public autoLoad(callback: (data: string) => void) {
        const docElement = document.getElementById('TEIEditorDocument');
        if (docElement) {
            callback(docElement.innerHTML);
        }
    }

    public load(callback: (data: string) => void) {
        const fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('class', 'hidden');
        const body = document.querySelector('body');
        if (body) {
            body.appendChild(fileSelector);
            fileSelector.click();
            fileSelector.addEventListener('change', function(ev: Event) {
                if (ev.target) {
                    const files = (ev.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = (ev: Event) => {
                            if (ev.target) {
                                callback((ev.target as FileReader).result as string);
                            }
                        }
                        reader.readAsText(files[0]);
                    }
                }
                fileSelector.remove();
            });
        }
    }

    public save(data: string) {
        const blob = new Blob([data], {type: 'text/xml;charset=utf-8'});
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'download.tei');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
</script>
