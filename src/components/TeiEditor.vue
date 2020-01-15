<template>
  <div id="tei-editor">
    <nav>
      <aria-menubar :items="menuItems" @action="menuAction" />
    </nav>
    <div>
      <template v-for="(section, sectionName, index) in sections">
        <template v-if="sectionName === currentSection">
          <metadata-editor v-if="section.type === 'MetadataEditor'" :key="index" :config="section"></metadata-editor>
          <text-editor v-if="section.type === 'TextEditor'" :key="index" :section="sectionName" :dataPath="'doc'" :uiPath="'doc'"></text-editor>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AriaMenubar from './AriaMenubar.vue';
import MetadataEditor from './MetadataEditor.vue';
import TextEditor from './TextEditor.vue';

@Component({
    components: {
        AriaMenubar,
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

    menuAction(name: string) {
        if (name.substring(0, 8) === 'section:') {
            this.$store.commit('setCurrentSection', name.substring(8));
        }
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
