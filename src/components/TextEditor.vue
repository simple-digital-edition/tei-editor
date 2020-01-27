<template>
  <div class="text-editor">
    <editor-content :editor="editor"/>
    <aria-menubar v-slot="{ keyboardNav }">
      <editor-menu-bar :editor="editor" v-slot="{ commands, isActive, getMarkAttrs }">
        <div class="sidebar">
          <div v-for="(block, idx) in activeSidebar" :key="idx" :class="{'is-active': block.active}">
            <h2>{{ block.label }}</h2>
            <template v-for="(section, idx2) in block.entities">
              <ul v-if="section.type === 'list'" :key="idx2">
                <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation">
                  <label><span v-html="menuitem.label"></span>
                    <input v-if="menuitem.type === 'setNodeAttrString'" :value="menuitem.value" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)"/>
                    <!--<input v-if="menuitem.type === 'setNodeAttrString'" :value="getNodeAttributeValue(menuitem.nodeType, menuitem.attr)" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)"/>-->
                  </label>
                </li>
              </ul>
              <ul v-if="section.type === 'menubar'" :key="idx2" role="menubar">
                <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation" :class="menuitem.type === 'separator' ? 'separator' : null">
                  <a v-if="menuitem.type === 'setNodeType'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="commands[menuitem.nodeType]()"></a>
                  <a v-else-if="menuitem.type === 'setNodeAttrValue'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, menuitem.value)"></a>
                  <select v-else-if="menuitem.type === 'selectNodeAttr'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)">
                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                  </select>
                  <a v-else-if="menuitem.type === 'toggleMark'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="commands[menuitem.nodeType]()"></a>
                  <select v-else-if="menuitem.type === 'selectMarkAttr'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="setMarkAttributeValue(menuitem.nodeType, menuitem.attr, $event.target.value)">
                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                  </select>
                  <a v-else-if="menuitem.type === 'editNestedDoc'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @click="editNestedDoc(commands, menuitem.nodeType, menuitem.attr, menuitem.targetType)"></a>
                  <a v-else-if="menuitem.type === 'closeNested'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @click="closeNestedAction"></a>
                  <select v-else-if="menuitem.type === 'linkNestedDoc'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="setNodeAttributeValue(commands, menuitem.nodeType, menuitem.attr, $event.target.value)">
                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                  </select>
                </li>
              </ul>
            </template>
          </div>
        </div>
      </editor-menu-bar>
    </aria-menubar>
    <div v-if="showNested" class="nested">
      <text-editor :section="section" :nestedSection="nestedSettings.section" :nestedId="nestedSettings.id" :closeNestedAction="closeNestedEditor"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
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
    name: 'text-editor',
})
export default class TextEditor extends Vue {
    @Prop({type: String})
    readonly section!: string;

    @Prop({type: String})
    readonly nestedSection!: string;

    @Prop({type: String})
    readonly nestedId!: string;

    @Prop({type: Function})
    readonly closeNestedAction!: any;

    editor: Editor | null = null;
    showNested = false;
    nestedSettings = null as any;
    internalContentUpdate = false;
    defaultNodeName = '';
    sidebar = [] as any;

    public get schema() {
        return this.$store.state.sections[this.$props.section].schema;
    }

    public get content() {
        return this.$store.state.content[this.$props.section];
    }

    public get doc() {
        if (this.content) {
            if (this.$props.nestedSection && this.$props.nestedId) {
                if (this.content.nested && this.content.nested[this.$props.nestedSection] && this.content.nested[this.$props.nestedSection][this.$props.nestedId]) {
                    return this.content.nested[this.$props.nestedSection][this.$props.nestedId].content[0];
                }
            } else {
                return this.content.doc;
            }
        }
        return null;
    }

    public get ui() {
        if (this.$props.nestedSection && this.$store.state.sections[this.$props.section].ui[this.$props.nestedSection]) {
            return this.$store.state.sections[this.$props.section].ui[this.$props.nestedSection];
        } else {
            return this.$store.state.sections[this.$props.section].ui.doc;
        }
    }

    /**
     * Computed property of all selected nodes.
     */
    private get selectedNodes() {
        if (this.editor) {
            const { from, to } = this.editor.state.selection;
            let selectedNodes = [] as any;
            this.editor.state.doc.nodesBetween(from, to, (node: any) => {
                selectedNodes.push(node);
            });
            return selectedNodes;
        } else {
            return [];
        }
    }

    /**
     * Get the menu ui schema with elements active status set.
     */
    public get activeSidebar() {
        const isActive = this.editor.isActive;
        this.sidebar.forEach((block: any) => {
            if (block.condition) {
                block.active = isActive[block.condition]();
            }
            block.entities.forEach((entityBlock: any) => {
                entityBlock.entities.forEach((entity: any) => {
                    if (entity.type === 'setNodeAttrString') {
                        entity.value = this.getNodeAttributeValue(entity.nodeType, entity.attr);
                    } else if (entity.type === 'setNodeType' || entity.type === 'toggleMark') {
                        entity.checked = isActive[entity.nodeType]() ? 'true' : 'false';
                    } else if (entity.type === 'setNodeAttrValue') {
                        entity.checked = this.hasNodeAttributeValue(entity.nodeType, entity.attr, entity.value) ? 'true' : 'false';
                    } else if (entity.type === 'selectNodeAttr') {
                        entity.values.forEach((value: any) => {
                            value.checked = this.hasNodeAttributeValue(entity.nodeType, entity.attr, value.value) ? true : false;
                        });
                    } else if (entity.type === 'selectMarkAttr') {
                        entity.values.forEach((value: any) => {
                            value.checked = this.hasMarkAttributeValue(entity.nodeType, entity.attr, value.value) ? true : false;
                        });
                    } else if (entity.type === 'linkNestedDoc') {
                        if (this.nestedDocIds[entity.targetType]) {
                            entity.values = this.nestedDocIds[entity.targetType];
                            entity.values.forEach((value: any) => {
                                value.checked = this.hasNodeAttributeValue(entity.nodeType, entity.attr, value.value);
                            });
                        } else {
                            entity.values = [{label: 'New', value: '', checked: false}];
                        }
                    }
                });
            });
        });
        return this.sidebar;
    }

    /**
     * Computed property to get the available nested doc ids.
     */
    private get nestedDocIds() {
        let nestedIds = {} as any;
        Object.entries(this.$store.state.content[this.$props.section].nested).forEach(([nestedKey, docObj]: any) => {
            nestedIds[nestedKey] = Object.keys(docObj).map((docKey: string) => {
                return {
                    label: docKey,
                    value: docKey,
                    checked: false,
                };
            });
            nestedIds[nestedKey].splice(0, 0, {label: 'New', value: '', checked: false});
        });
        return nestedIds;
    }

    public mounted() {
        // Initialise the editor schema
        let extensions = [
            new Doc(),
            new Text(),
        ];
        this.defaultNodeName = '';
        this.schema.forEach((config: any) => {
            if (config.type === 'block') {
                extensions.push(new BlockNode(config));
                if (this.defaultNodeName === '') {
                    this.defaultNodeName = config.name;
                }
            } else if (config.type === 'wrapping') {
                extensions.push(new WrappingNode(config));
            } else if (config.type === 'inline' && config.name !== 'text') {
                extensions.push(new InlineNode(config));
            } else if (config.type === 'mark') {
                extensions.push(new MarkNode(config));
            }
        });
        // Initialise the editor
        this.editor = new Editor({
            useBuiltInExtensions: false,
            extensions: extensions,
            content: {type: 'doc', content: [{ type: this.defaultNodeName, content: [] }]},
            onUpdate: ({ getJSON }: any) => {
                this.internalContentUpdate = true;
                if (this.$props.nestedSection && this.$props.nestedId) {
                    this.$store.commit('setTextDoc', { path: this.$props.section + '.nestedId.' + this.$props.nestedSection + '.' + this.$props.nestedId, doc: getJSON() });
                } else {
                    this.$store.commit('setTextDoc', { path: this.$props.section + '.doc', doc: getJSON() });
                }
            }
        });
        if (this.doc) {
            this.editor.setContent(this.doc);
        }
        this.editor.focus();
        // Initialise the sidebar structure
        this.sidebar = this.ui.map((blockSchema: any) => {
            let block = {
                label: blockSchema.label,
                active: true,
            } as any;
            if (blockSchema.condition) {
                block.condition = blockSchema.condition.activeType;
            }
            if (blockSchema.entities) {
                block.entities = blockSchema.entities.map((entityBlockSchema: any) => {
                    let entityBlock = {
                        type: entityBlockSchema.type,
                    } as any;
                    if (entityBlockSchema.entities) {
                        entityBlock.entities = entityBlockSchema.entities.map((entitySchema: any, idx: number) => {
                            let entity = {
                                type: entitySchema.type,
                                label: entitySchema.label,
                                nodeType: entitySchema.nodeType || entitySchema.markType,
                                attr: entitySchema.attr,
                                value: '',
                                checked: 'false',
                                tabindex: idx === 0 ? 0 : -1,
                            } as any;
                            if (entitySchema.type === 'selectNodeAttr' || entitySchema.type === 'selectMarkAttr') {
                                entity.values = entitySchema.values.map((value: any) => {
                                    return {
                                        label: value.label,
                                        value: value.value,
                                        checked: false,
                                    }
                                });
                            } else if (entitySchema.type === 'setNodeAttrValue') {
                                entity.value = entitySchema.value;
                            } else if (entitySchema.type === 'editNestedDoc') {
                                entity.targetType = entitySchema.targetNodeType;
                            } else if (entitySchema.type === 'linkNestedDoc') {
                                entity.targetType = entitySchema.targetNodeType;
                                entity.values = [];
                            }
                            return entity;
                        });
                    }
                    return entityBlock;
                });
            }
            return block;
        });
    }

    public beforeDestroy() {
        if (this.editor) {
            this.editor.destroy();
        }
    }

    @Watch('doc')
    public updateContent(newValue: any) {
        if (!this.internalContentUpdate && this.editor) {
            this.editor.setContent(newValue);
        }
        this.internalContentUpdate = false;
    }

    /**
     * Gets a node attribute value.
     */
    public getNodeAttributeValue(nodeName: string, attrName: string) {
        for (let idx = 0; idx < this.selectedNodes.length; idx++) {
            let node = this.selectedNodes[idx];
            if (node.type.name === nodeName) {
                if (node.attrs[attrName] !== undefined && node.attrs[attrName] !== null) {
                    return node.attrs[attrName];
                }
            }
        }
        return '';
    }

    /**
     * Checks whether a node has an attribute with the given value.
     */
    public hasNodeAttributeValue(nodeName: string, attrName: string, value: string) {
        return this.getNodeAttributeValue(nodeName, attrName) === value;
    }

    /**
     * Set a node attribute to the given value. Keeps all other attributes the same value.
     */
    public setNodeAttributeValue(commands: any, nodeName: string, attrName: string, value: string) {
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

    /**
     * Gets a mark attribute value.
     */
    public getMarkAttributeValue(markName: string, attrName: string) {
        for (let idx = 0; idx < this.selectedNodes.length; idx++) {
            let node = this.selectedNodes[idx];
            if (node.marks) {
                for (let idx2 = 0; idx2 < node.marks.length; idx2++) {
                    let mark = node.marks[idx2];
                    if (mark.type.name === markName) {
                        return mark.attrs[attrName];
                    }
                }
            }
        }
        return '';
    }

    /**
     * Checks whether a mark has a given attribute value.
     */
    public hasMarkAttributeValue(markName: string, attrName: string, value: string) {
        return this.getMarkAttributeValue(markName, attrName) === value;
    }

    /**
     * Sets the mark's attribute value.
     */
    public setMarkAttributeValue(markName: string, attrName: string, value: string) {
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

    /**
     * Open the nested editor.
     */
    public editNestedDoc(commands: any, nodeName: string, attrName: string, editNodeName: string) {
        let nestedId = this.getNodeAttributeValue(nodeName, attrName);
        if (!nestedId) {
            let nestedDocs = this.$store.state.content[this.$props.section].nested[editNodeName];
            nestedId = editNodeName + '-1';
            let idx = 1;
            while (nestedDocs && nestedDocs[nestedId]) {
                idx = idx + 1;
                nestedId = editNodeName + '-' + idx;
            }
            this.setNodeAttributeValue(commands, nodeName, attrName, nestedId);
            this.$store.commit('addNestedDoc', { path: this.$props.section + '.nested.' + editNodeName + '.' + nestedId, doc: {type: 'doc', content: [{type: 'paragraph', content: []}]}});
        }
        this.showNested = true;
        this.nestedSettings = {
            section: editNodeName,
            id: nestedId
        };
    }

    /**
     * Close the nested editor.
     */
    public closeNestedEditor() {
        this.showNested = false;
        this.nestedSettings = null;
    }
}
</script>
