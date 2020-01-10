<template>
  <div class="text-editor">
    <editor-content :editor="editor"/>
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive, getMarkAttrs }">
      <div>
         <div v-for="(block, idx) in activeUIBlocks" :key="idx">
          <h2>{{ block.label }}</h2>
          <template v-for="(section, idx2) in block.entities">
            <ul v-if="section.type === 'list'" :key="idx2">
              <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation">
                <label>{{ menuitem.label }}
                  <input v-if="menuitem.type === 'setNodeAttrString'" :value="getNodeAttributeValue(menuitem.nodeType, menuitem.attr)" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)"/>
                </label>
              </li>
            </ul>
            <ul v-if="section.type === 'menubar'" :key="idx2" role="menubar">
              <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation">
                <a v-if="menuitem.type === 'setNodeType'" role="menuitem" v-html="menuitem.label" :aria-checked="isActive[menuitem.nodeType]() ? 'true' : 'false'" @click="commands[menuitem.nodeType]()"></a>
                <a v-if="menuitem.type === 'setNodeAttrValue'" role="menuitem" v-html="menuitem.label" :aria-checked="hasNodeAttributeValue(menuitem.nodeType, menuitem.attr, menuitem.value) ? 'true' : 'false'" @click="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, menuitem.value)"></a>
                <a v-if="menuitem.type === 'toggleMark'" role="menuitem" v-html="menuitem.label" :aria-checked="isActive[menuitem.markType]() ? 'true' : 'false'" @click="commands[menuitem.markType]()"></a>
                <select v-if="menuitem.type === 'selectNodeAttr'" role="menuitem" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)">
                  <option v-for="value in menuitem.values" :key="value.value" :selected="hasNodeAttributeValue(menuitem.nodeType, menuitem.attr, value.value)" :value="value.value">{{ value.label }}</option>
                </select>
              </li>
            </ul>
          </template>
        </div>
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
import MarkNode from '@/nodes/MarkNode';
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
            } else if (config.type === 'inline' && config.name !== 'text') {
            } else if (config.type === 'mark') {
                extensions.push(new MarkNode(config));
            }
        });
        return {
            editor: new Editor({
                useBuiltInExtensions: false,
                extensions: extensions,
                content: this.$store.state.data[this.$props.section],
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

    get ui() {
        return this.$store.state.sections[this.$props.section].ui;
    }

    get activeUIBlocks() {
        const isActive = this.editor.isActive;
        return this.ui.filter((block: any) => {
            if (block.condition) {
                if (block.condition.type === 'isActive') {
                    return isActive[block.condition.activeType]();
                }
                return false;
            }
            return true;
        });
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
