<template>
  <div class="text-editor">
    <editor-content :editor="editor"/>
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive, getMarkAttrs }">
      <div class="sidebar">
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
            <aria-menubar v-if="section.type === 'menubar'" :key="idx2" v-slot="{ keyboardNav }">
              <ul role="menubar">
                <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation">
                  <a v-if="menuitem.type === 'setNodeType'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" v-html="menuitem.label" :aria-checked="isActive[menuitem.nodeType]() ? 'true' : 'false'" @keyup="keyboardNav" @click="commands[menuitem.nodeType]()"></a>
                  <a v-if="menuitem.type === 'setNodeAttrValue'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" v-html="menuitem.label" :aria-checked="hasNodeAttributeValue(menuitem.nodeType, menuitem.attr, menuitem.value) ? 'true' : 'false'" @keyup="keyboardNav" @click="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, menuitem.value)"></a>
                  <a v-if="menuitem.type === 'toggleMark'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" v-html="menuitem.label" :aria-checked="isActive[menuitem.markType]() ? 'true' : 'false'" @keyup="keyboardNav" @click="commands[menuitem.markType]()"></a>
                  <select v-if="menuitem.type === 'selectNodeAttr'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" @keyup="keyboardNav" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)">
                    <option v-for="value in menuitem.values" :key="value.value" :selected="hasNodeAttributeValue(menuitem.nodeType, menuitem.attr, value.value)" :value="value.value">{{ value.label }}</option>
                  </select>
                  <select v-if="menuitem.type === 'selectMarkAttr'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" @keyup="keyboardNav" @change="setMarkAttributeValue(menuitem.markType, menuitem.attr, $event.target.value)">
                    <option v-for="value in menuitem.values" :key="value.value" :selected="hasMarkAttributeValue(menuitem.markType, menuitem.attr, value.value)" :value="value.value">{{ value.label }}</option>
                  </select>
                  <a v-if="menuitem.type === 'editNestedDoc'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" v-html="menuitem.label" @keyup="keyboardNav" @click="editNestedDoc(commands, menuitem.nodeType, menuitem.attr, menuitem.targetNodeType)"></a>
                  <a v-if="menuitem.type === 'closeNested'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" v-html="menuitem.label" @keyup="keyboardNav" @click="closeNestedAction"></a>
                  <select v-if="menuitem.type === 'linkNestedDoc'" role="menuitem" :tabindex="idx3 === 0 ? '0' : '-1'" @keyup="keyboardNav" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)">
                    <option v-for="value in getNestedIds(menuitem.targetNodeType)" :key="value.value" :selected="hasNodeAttributeValue(menuitem.nodeType, menuitem.attr, value.value)" :value="value.value">{{ value.label }}</option>
                  </select>
                </li>
              </ul>
            </aria-menubar>
          </template>
        </div>
      </div>
    </editor-menu-bar>
    <div v-if="showNested" class="nested">
      <text-editor :section="section" :dataPath="nestedSettings.dataPath" :uiPath="nestedSettings.uiPath" :closeNestedAction="closeNestedEditor"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
// @ts-ignore
import { Editor, EditorContent, EditorMenuBar, Doc, Text } from 'tiptap';
// @ts-ignore
import { removeMark, updateMark } from 'tiptap-commands'
import AriaMenubar from './AriaMenubar.vue';
import BlockNode from '@/nodes/BlockNode';
import WrappingNode from '@/nodes/WrappingNode';
import InlineNode from '@/nodes/InlineNode';
import MarkNode from '@/nodes/MarkNode';
import get from '@/util/get';

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
            } else if (config.type === 'wrapping') {
                extensions.push(new WrappingNode(config));
            } else if (config.type === 'inline' && config.name !== 'text') {
                extensions.push(new InlineNode(config));
            } else if (config.type === 'mark') {
                extensions.push(new MarkNode(config));
            }
        });
        return {
            editor: new Editor({
                useBuiltInExtensions: false,
                extensions: extensions,
                content: get(this.$store.state.data[this.$props.section], this.$props.dataPath),
                onUpdate: ({ getJSON }: any) => {
                    this.$store.commit('setTextDoc', {
                        section: this.$props.section,
                        path: this.$props.dataPath,
                        doc: getJSON(),
                    });
                }
            }),
        };
    },
    props: {
        section: String,
        dataPath: String,
        uiPath: String,
        closeNestedAction: Function,
    },
})
export default class TextEditor extends Vue {
    editor:Editor;
    showNested = false;
    nestedSettings = null as any;

    public mounted() {
        this.editor.focus();
    }

    public beforeDestroy() {
        this.editor.destroy()
    }

    get schema() {
        return this.$store.state.sections[this.$props.section].schema;
    }

    get ui() {
        return get(this.$store.state.sections[this.$props.section].ui, this.$props.uiPath);
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
                attributes = {...attributes, ...node.attrs};
            }
        });
        attributes[attrName] = value;
        commands[nodeName + '_setAttribute'](attributes);
    }

    getMarkAttributeValue(markName: string, attrName: string) {
        const { from, to } = this.editor.state.selection;
        let value = '';
        this.editor.state.doc.nodesBetween(from, to, (node: any) => {
            if (node.marks) {
                node.marks.forEach((mark: any) => {
                    if (mark.type.name === markName) {
                        value = mark.attrs[attrName];
                    }
                });
            }
        });
        return value
    }

    hasMarkAttributeValue(markName: string, attrName: string, value: string) {
        return this.getMarkAttributeValue(markName, attrName) === value;
    }

    setMarkAttributeValue(markName: string, attrName: string, value: string) {
        if (value) {
            const { from, to } = this.editor.state.selection;
            let attributes = {} as any;
            this.editor.state.doc.nodesBetween(from, to, (node: any) => {
                if (node.marks) {
                    node.marks.forEach((mark: any) => {
                        if (mark.type.name === markName) {
                            attributes = {...attributes, ...mark.attrs};
                        }
                    });
                }
            });
            attributes[attrName] = value;
            updateMark(this.editor.schema.marks[markName], attributes)(this.editor.state, this.editor.dispatchTransaction.bind(this.editor));
        } else {
            removeMark(this.editor.schema.marks[markName])(this.editor.state, this.editor.dispatchTransaction.bind(this.editor));
        }
    }

    editNestedDoc(commands: any, nodeName: string, attrName: string, editNodeName: string) {
        let nestedId = this.getNodeAttributeValue(nodeName, attrName);
        if (!nestedId) {
            let nestedDocs = this.$store.state.data[this.$props.section].nested[editNodeName];
            nestedId = editNodeName + '-1';
            let idx = 1;
            while (nestedDocs && nestedDocs[nestedId]) {
                idx = idx + 1;
                nestedId = editNodeName + '-' + idx;
            }
            this.setNodeAttributeValue(commands, nodeName, attrName, nestedId);
            this.$store.commit('addNestedDoc', {section: this.$props.section, nodeType: editNodeName, nodeId: nestedId});
        }
        this.showNested = true;
        this.nestedSettings = {
            'dataPath': 'nested.' + editNodeName + '.' + nestedId + '.content.[0]',
            'uiPath': editNodeName,
        };
    }

    closeNestedEditor() {
        this.showNested = false;
        this.nestedSettings = null;
    }

    getNestedIds(targetType: string) {
        let nestedIds = [{value: '', label: 'New'}];
        Object.keys(this.$store.state.data[this.$props.section].nested[targetType]).forEach((key) => {
            nestedIds.push({value: key, label: key});
        });
        return nestedIds;
    }
}
</script>
