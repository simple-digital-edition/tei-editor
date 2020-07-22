<template>
    <div id="tei-editor">
        <nav>
            <aria-menubar v-slot="{ keyboardNav, mouseClickNav }">
                <ul role="menubar">
                    <li v-if="loadCallback" role="presentation">
                        <a role="menuitem" tabindex="-1" @click="mouseClickNav($event); load()" @keyup="keyboardNav">Load</a>
                    </li>
                    <li role="presentation">
                        <a role="menuitem" tabindex="-1" @click="mouseClickNav($event); save()" @keyup="keyboardNav">Save</a>
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
import MetadataEditor from './MetadataEditor.vue';
import TextEditor from './TextEditor.vue';

import TEIMetadataParser from '../util/TEIMetadataParser';
import TEITextParser from '../util/TEITextParser';
import TEISeraliser from '../util/TEISerialiser';

import { Config, TextDocsStore, TextSection, MetadataSection } from '../interfaces';

/**
 * The TeiEditor component provides the full editor interface, for both text and metadata editing.
 */
@Component({
    components: {
        AriaMenubar,
        TextEditor,
        MetadataEditor,
    },
})
export default class TeiEditor extends Vue {
    @Prop() public config!: Config;
    @Prop() public autoLoadCallback!: (callback: (data: string) => void) => void;
    @Prop() public loadCallback!: (callback: (data: string) => void) => void;
    public currentSection: string | null = null;
    public textData = {} as TextDocsStore;
    public metadata = {};

    // ================
    // Lifecycle events
    // ================

    /**
     * Mount the component, initialising the current section and automatically loading any content.
     */
    public mounted() {
        this.currentSection = Object.keys(this.config.sections)[0];
        if (this.autoLoadCallback) {
            this.autoLoadCallback(this.loadData);
        }
    }

    // ==============
    // Event handlers
    // ==============

    /**
     * Set the currently selected section.
     */
    public setCurrentSection(section: string) {
        this.currentSection = section;
    }

    /**
     * Save the current state of the various sections and emit the serialised data via the "save" event.
     */
    public save() {
        const serialiser = new TEISeraliser();
        const data = { metadata: this.metadata, ... this.textData}
        this.$emit('save', serialiser.serialise(data, this.config.sections));
    }

    /**
     * Load the editor state via the configured loadCallback.
     */
    public load() {
        if (this.loadCallback) {
            this.loadCallback(this.loadData);
        }
    }

    /**
     * Handler to load the actual data.
     */
    public loadData(data: string) {
        const domParser = new DOMParser();
        const dom = domParser.parseFromString(data, 'application/xml');
        this.metadata = {};
        this.textData = {};
        Object.entries(this.config.sections).forEach(([key, config]: [string, TextSection | MetadataSection]) => {
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
