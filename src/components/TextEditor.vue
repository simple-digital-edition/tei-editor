<template>
  <div class="text-editor">
    <editor-content :editor="editor"/>
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive, getMarkAttrs }">
      <div>
          {{getMarkAttrs()}}
        <div>
          <h2>Blocktypes</h2>
          <ul role="menubar">
            <template v-for="(config, idx) in schema">
              <li v-if="config.type === 'block'" :key="idx">
                <a role="menuitem" :aria-checked="isActive[config.name]() ? 'true': 'false'" @click="commands[config.name]()">{{ config.label }}</a>
              </li>
            </template>
          </ul>
        </div>
        <template v-for="(config, idx) in schema">
          <div v-if="isActive[config.name]() && config.attrs" :key="idx">
            <h2>{{ config.label }}</h2>
            <ul role="menubar">
              <template v-for="(attr, attrName, idx2) in config.attrs">
                <li v-if="attr.ui" :key="idx2" role="presentation">
                  <select v-if="attr.ui.selectValues" @change="commands[config.name]({[attrName]: $event.target.value})">
                    <option v-for="value in attr.ui.selectValues" :key="value.value" :value="value.value" :selected="isActive[config.name]({[attrName]: value.value})">{{ value.label }}</option>
                  </select>
                  <input v-if="attr.ui.stringValue" type="text" @change="commands[config.name]({[attrName]: $event.target.value})" :placeholder="attr.ui.stringValue"/>
                </li>
              </template>
            </ul>
          </div>
        </template>
      </div>
    </editor-menu-bar>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
// @ts-ignore
import { Editor, EditorContent, EditorMenuBar, Doc, Text } from 'tiptap';
import AriaMenubar from './AriaMenubar.vue';
import BlockNode from '@/nodes/BlockNode';
import { MenuItem } from '@/interfaces';

@Component({
    components: {
        EditorContent,
        EditorMenuBar,
        AriaMenubar,
    },
    data() {
        let extensions = [
            new Doc(),
            new Text(),
        ];
        this.$store.state.sections[this.$props.section].schema.forEach((config: any) => {
            if (config.type === 'block') {
                extensions.push(new BlockNode(config));
            }
        });
        return {
            editor: new Editor({
                useBuiltInExtensions: false,
                extensions: extensions,
                content: '<div class="node-heading" data-level="1">Testing</div><div class="node-paragraph">Test 1 2 3</div>',
            }),
        };
    },
    props: {
        section: String,
    },
})
export default class TextEditor extends Vue {
    editor:Editor;

    public beforeDestroy() {
        this.editor.destroy()
    }

    get schema() {
        return this.$store.state.sections[this.$props.section].schema;
    }
}
</script>
