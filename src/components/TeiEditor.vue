<template>
  <div id="tei-editor">
    <nav>
      <aria-menubar v-slot="{ keyboardNav, mouseClickNav }">
        <ul role="menubar">
          <li v-if="hasSaveCallback || hasLoadCallback" role="presentation">
            <a role="menuitem" tabindex="0" aria-expanded="false" @keyup="keyboardNav" @click="mouseClickNav">File</a>
            <aria-menu v-slot="{ keyboardNav, mouseClickNav }">
              <ul role="menu" aria-hidden="true">
                <li v-if="hasLoadCallback" role="presentation">
                  <a role="menuitem" tabindex="-1" @click="mouseClickNav($event); load()" @keyup="keyboardNav">Load</a>
                </li>
                <li v-if="hasSaveCallback" role="presentation">
                  <a role="menuitem" tabindex="-1" @click="mouseClickNav($event); save()" @keyup="keyboardNav">Save</a>
                </li>
              </ul>
           </aria-menu>
          </li>
          <li v-for="(section, key, idx) in sections" :key="idx" role="presentation">
            <a role="menuitem" tabindex="-1" :aria-checked="(key === currentSection) ? 'true' : 'false'" @click="mouseClickNav($event); setCurrentSection(key)" @keyup="keyboardNav">{{ section.label }}</a>
          </li>
        </ul>
      </aria-menubar>
    </nav>
    <div>
      <template v-for="(section, sectionName, index) in sections">
        <template v-if="sectionName === currentSection">
          <metadata-editor v-if="section.type === 'MetadataEditor'" :key="index" :config="section"></metadata-editor>
          <text-editor v-if="section.type === 'TextEditor'" :key="index" :section="sectionName" :data="sectionData(sectionName)" :dataPath="'doc'" :uiPath="'doc'"></text-editor>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AriaMenubar from './AriaMenubar.vue';
import AriaMenu from './AriaMenu.vue';
import MetadataEditor from './MetadataEditor.vue';
import TextEditor from './TextEditor.vue';
import TEISeraliser from '@/util/TEISerialiser';

@Component({
    components: {
        AriaMenubar,
        AriaMenu,
        MetadataEditor,
        TextEditor,
    },
})
export default class TeiEditor extends Vue {
    public get menuItems() {
        return this.$store.state.ui.mainMenu;
    }

    public get sections() {
        return this.$store.state.sections;
    }

    public get currentSection() {
        return this.$store.state.ui.currentSection;
    }

    public get hasSaveCallback() {
        return this.$store.state.callbacks.save !== null;
    }

    public get hasLoadCallback() {
        return this.$store.state.callbacks.load !== null;
    }

    public sectionData(sectionName: string) {
        return this.$store.state.data[sectionName];
    }

    public save() {
        if (this.hasSaveCallback) {
            let serialiser = new TEISeraliser();
            this.$store.state.callbacks.save(serialiser.serialise(this.$store.state.data, this.$store.state.sections));
        }
    }

    public load() {
        if (this.hasLoadCallback) {
            this.$store.state.callbacks.load((data: string) => {
                this.$store.dispatch('load', data);
            });
        }
    }

    public setCurrentSection(section: string) {
        this.$store.commit('setCurrentSection', section);
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
      }

      > div.sidebar {
          flex: 0 0 auto;
      }

      > div.nested {
          position: absolute;
          width: 100%;
          height: 100%;
      }
  }
}
</style>
