<template>
    <div id="tei-editor">
        <nav>
            <aria-menubar v-slot="{ keyboardNav, mouseClickNav }">
                <ul role="menubar">
                    <li v-if="loadCallback || saveCallback" role="presentation">
                        <a role="menuitem" tabindex="0" aria-expanded="false" @keyup="keyboardNav" @click="mouseClickNav">File</a>
                        <aria-menu v-slot="{ keyboardNav, mouseClickNav }">
                            <ul role="menu" aria-hidden="true">
                                <li v-if="loadCallback" role="presentation">
                                    <a role="menuitem" tabindex="-1" @click="mouseClickNav($event); load()" @keyup="keyboardNav">Load</a>
                                </li>
                                <li v-if="saveCallback" role="presentation">
                                    <a role="menuitem" tabindex="-1" @click="mouseClickNav($event); save()" @keyup="keyboardNav">Save</a>
                                </li>
                            </ul>
                        </aria-menu>
                    </li>
                    <li v-for="(section, key, idx) in config.sections" :key="idx" role="presentation">
                        <a role="menuitem" tabindex="-1" :aria-checked="(key === currentSection) ? 'true' : 'false'" @click="mouseClickNav($event); setCurrentSection(key)" @keyup="keyboardNav">{{ section.label }}</a>
                    </li>
                </ul>
            </aria-menubar>
        </nav>
        <div>
            <template v-for="(section, key, index) in config.sections">
                <template v-if="key === currentSection">
                    <metadata-editor v-if="section.type === 'MetadataEditor'" :key="index" :config="section" :value="metadata"></metadata-editor>
                    <text-editor v-if="section.type === 'TextEditor'" :key="index" :config="section" v-model="textData[key].doc" :nestedDocs="textData[key].nested"></text-editor>
                </template>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import AriaMenubar from './AriaMenubar.vue';
import AriaMenu from './AriaMenu.vue';
import MetadataEditor from './MetadataEditor.vue';
import TextEditor from './TextEditor.vue';

import TEIMetadataParser from '@/util/TEIMetadataParser';
import TEITextParser from '@/util/TEITextParser';
import TEISeraliser from '@/util/TEISerialiser';

import { Config, TextDocsStore } from '@/interfaces';

@Component({
    components: {
        AriaMenubar,
        AriaMenu,
        TextEditor,
        MetadataEditor,
    },
})
export default class TeiEditor extends Vue {
    @Prop() public config!: Config;
    public currentSection: string | null = null;
    public textData = {} as TextDocsStore;
    public metadata = {};

    public get saveCallback() {
        // @ts-ignore
        if (window.TEIEditor && window.TEIEditor.callbacks && window.TEIEditor.callbacks.save) {
            // @ts-ignore
            return window.TEIEditor.callbacks.save;
        } else{
            return null;
        }
    }

    public get loadCallback() {
        // @ts-ignore
        if (window.TEIEditor && window.TEIEditor.callbacks && window.TEIEditor.callbacks.load) {
            // @ts-ignore
            return window.TEIEditor.callbacks.load;
        } else{
            return null;
        }
    }

    public get autoLoadCallback() {
        // @ts-ignore
        if (window.TEIEditor && window.TEIEditor.callbacks && window.TEIEditor.callbacks.autoLoad) {
            // @ts-ignore
            return window.TEIEditor.callbacks.autoLoad;
        } else{
            return null;
        }
    }

    public mounted() {
        this.currentSection = Object.keys(this.config.sections)[0];
        if (this.autoLoadCallback) {
            this.autoLoadCallback(this.loadData);
        }
    }

    public setCurrentSection(section: string) {
        this.currentSection = section;
    }

    public save() {
        if (this.saveCallback) {
            const serialiser = new TEISeraliser();
            const data = { metadata: this.metadata, ... this.textData}
            this.saveCallback(serialiser.serialise(data, this.config.sections));
            //this.saveCallback(serialiser.serialise(this.$store.state.content, this.$store.state.sections));
        }
    }

    public load() {
        if (this.loadCallback) {
            this.loadCallback(this.loadData);
        }
    }

    private loadData(data: string) {
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(data, 'application/xml');
        Object.entries(this.config.sections).forEach(([key, config]) => {
            if (config.type === 'MetadataEditor') {
                this.metadata = (new TEIMetadataParser(dom, config)).get();
            } else if (config.type === 'TextEditor') {
                const [doc, nestedDocs] = (new TEITextParser(dom, config)).get();
                Vue.set(this.textData, key, {
                    doc: doc,
                    nested: nestedDocs,
                });
            }
        });
    }

    /*

    public get sections() {
        return this.$store.state.sections;
    }

    public get hasSaveCallback() {
        return this.$store.state.callbacks.save ? true : false;
    }

    public get hasLoadCallback() {
        return this.$store.state.callbacks.load ? true : false;
    }

    public setCurrentSection(section: string) {
        this.currentSection = section;
    }

    public getContentForSection(sectionName: string) {
        return get(this.$store.state.content, sectionName);
    }

    public setContentForSection(section: string, doc: any) {
        this.$store.commit('setTextDoc', { path: section, doc: doc});
    }

    public mounted() {
        let sections = Object.keys(this.sections);
        if (sections.length > 0) {
            this.currentSection = sections[0];
        }
    }

    public save() {
        if (this.hasSaveCallback) {
            let serialiser = new TEISeraliser();
            this.$store.state.callbacks.save(serialiser.serialise(this.$store.state.content, this.$store.state.sections));
        }
    }

    public load() {
        if (this.hasLoadCallback) {
            this.$store.state.callbacks.load((data: string) => {
                this.$store.dispatch('load', data);
            });
        }
    }

    @Watch('sections')
    public updateSections() {
        let sections = Object.keys(this.sections);
        if (sections.length > 0) {
            this.currentSection = sections[0];
        }
    }*/
}
</script>

<style lang="scss">
#tei-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;

  > nav {
      flex: 0 0 auto;
  }

  > div {
      flex: 1 1 auto;
      overflow: auto;
  }

  svg {
      width: 24px;
      height: 24px;
  }

  ol, ul {
      margin: 0;
      padding: 0;

      &.multi-row {
          > li {
              display: flex;
              flex-direction: row;

              > div {
                  flex: 1 1 auto;
              }

              > ul {
                  flex: 0 0 auto;
              }
          }
      }

      &.multi-field {
          display: flex;
          flex-direction: row;

          > li {
              flex: 1 1 auto;
          }
      }

      li {
          list-style-type: none;
      }
  }

  .text-editor {
      display: flex;
      flex-direction: row;
      height: 100%;
      width: 100%;
      position: relative;

      > div:nth-child(1) {
          flex: 1 1 auto;
          overflow-y: auto;
      }

      > div.sidebar {
          flex: 0 0 auto;
          overflow-y: auto;

          > div {
              display: none;

              &.is-active {
                  display: block;
              }
          }
      }

      > div.nested {
          position: absolute;
          width: 100%;
          height: 100%;
      }
  }
}
</style>
