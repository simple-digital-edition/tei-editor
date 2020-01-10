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
            <div v-for="(uiBlock, idx2) in config.ui" :key="idx2">
              <ul v-if="uiBlock.type === 'list'">
                <li v-for="(uiElement, idx3) in uiBlock.entities" :key="idx3">
                  <label>{{ uiElement.label }}
                    <input v-if="uiElement.type === 'string'" type="text" :value="getNodeAttributeValue(config.name, uiElement.attr)" @change="setNodeAttributeValue(commands, config.name, uiElement.attr, $event.target.value)"/>
                  </label>
                </li>
              </ul>
              <ul v-if="uiBlock.type === 'menubar'" role="menubar">
                <li v-for="(uiElement, idx3) in uiBlock.entities" :key="idx3" role="presentation">
                  <select v-if="uiElement.type === 'select'" role="menuitem" @change="setNodeAttributeValue(commands, config.name, uiElement.attr, $event.target.value)">
                    <option v-for="value in uiElement.values" :key="value.value" :selected="hasNodeAttributeValue(config.name, uiElement.attr, value.value)" :value="value.value">{{ value.label }}</option>
                  </select>
                  <a v-if="uiElement.type === 'button'" v-html="uiElement.label" role="menuitem" :aria-selected="hasNodeAttributeValue(config.name, uiElement.attr, uiElement.value) ? 'true' : 'false'" @click="setNodeAttributeValue(commands, config.name, uiElement.attr, uiElement.value)"></a>
                </li>
              </ul>
            </div>
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
                content: '<div class="node-heading" data-level="1" data-navIdentifier="Test">Testing</div><div class="node-paragraph">Test 1 2 3</div>',
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

    /**
     * Gets a node attribute value.
     */
    getNodeAttributeValue(nodeName: string, attrName: string) {
        const { from, to } = this.editor.state.selection;
        let value = '';
        this.editor.state.doc.nodesBetween(from, to, (node: any) => {
            if (node.type.name === nodeName) {
                if (node.attrs[attrName] !== undefined && node.attrs[attrName] !== null) {
                    value = node.attrs[attrName];
                }
            }
        });
        return value;
    }

    /**
     * Checks whether a node has an attribute with the given value.
     */
    hasNodeAttributeValue(nodeName: string, attrName: string, value: string) {
        return this.getNodeAttributeValue(nodeName, attrName) === value;
    }

    /**
     * Set a node attribute to the given value. Keeps all other attributes the same value.
     */
    setNodeAttributeValue(commands: any, nodeName: string, attrName: string, value: string) {
        const { from, to } = this.editor.state.selection;
        let attributes = {} as any;
        this.editor.state.doc.nodesBetween(from, to, (node: any) => {
            if (node.type.name === nodeName) {
                attributes = {...node.attrs};
            }
        });
        attributes[attrName] = value;
        commands[nodeName](attributes);
    }
}
</script>
