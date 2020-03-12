<template>
    <div class="text-editor">
        <div class="editor"></div>
        <aria-menubar v-slot="{ keyboardNav }">
            <div class="sidebar">
                <div v-for="(block, idx) in sidebar" :key="idx" :class="{'is-active': block.active}">
                    <h2>{{ block.label }}</h2>
                    <template v-for="(section, idx2) in block.entities">
                        <ul v-if="section.type === 'list'" :key="idx2">
                            <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation">
                                <label><span v-html="menuitem.label"></span>
                                    <input v-if="menuitem.type === 'setNodeAttrString'" :value="menuitem.value" @change="setNodeType(menuitem, $event)"/>
                                </label>
                            </li>
                        </ul>
                        <ul v-else-if="section.type === 'menubar'" :key="idx2" role="menubar">
                            <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation" :class="menuitem.type === 'separator' ? 'separator' : null">
                                <a v-if="menuitem.type === 'setNodeType'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="setNodeType(menuitem)"></a>
                                <a v-else-if="menuitem.type === 'setNodeAttrValue'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="setNodeType(menuitem)"></a>
                                <select v-else-if="menuitem.type === 'selectNodeAttr'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="setNodeType(menuitem, $event)">
                                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                                </select>
                                <a v-else-if="menuitem.type === 'toggleMark'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" :aria-checked="menuitem.checked" @keyup="keyboardNav"></a>
                                <select v-else-if="menuitem.type === 'selectMarkAttr'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav">
                                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                                </select>
                                <a v-else-if="menuitem.type === 'editNestedDoc'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" @keyup="keyboardNav"></a>
                                <a v-else-if="menuitem.type === 'closeNested'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" @keyup="keyboardNav"></a>
                                <select v-else-if="menuitem.type === 'linkNestedDoc'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="setNodeType(menuitem, $event)">
                                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                                </select>
                            </li>
                        </ul>
                    </template>
                </div>
            </div>
        </aria-menubar>
    <div v-if="showNested" class="nested">
      <text-editor :section="section" :nestedSection="nestedSettings.section" :nestedId="nestedSettings.id" :closeNestedAction="closeNestedEditor"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { Schema, Fragment, Slice } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { baseKeymap, setBlockType } from 'prosemirror-commands';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import AriaMenubar from './AriaMenubar.vue';
import get from '@/util/get';
import deepclone from '@/util/deepclone';
import { generateSchemaNodes, generateSchemaMarks } from '@/util/prosemirror';
import { TextEditorSidebarBlockConfig, TextEditorActiveElements, TextEditorMenuItem, TextEditorMenuItemValuesValue } from '@/interfaces';

@Component({
    components: {
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

    editor: EditorView | null = null;
    showNested = false;
    nestedSettings = null as any;
    internalContentUpdate = false;
    stateDebounce: number | null = null

    active: TextEditorActiveElements = {};

    // ===================
    // Computed properties
    // ===================

    public get schema() {
        return this.$store.state.sections[this.$props.section].schema;
    }

    public get editorSchema() {
        return new Schema({
            nodes: generateSchemaNodes(this.schema),
            marks: generateSchemaMarks(this.schema),
        });
    }

    public get editorPlugins() {
        return [
            history(),
            keymap({
                'Mod-z': undo,
                'Mod-y': redo
            }),
            keymap(baseKeymap)
        ];
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

    public get sidebar() {
        return this.ui.map((blockSchema: TextEditorSidebarBlockConfig) => {
            return {
                label: blockSchema.label,
                active: blockSchema.condition ? this.active[blockSchema.condition.activeType] : true,
                entities: blockSchema.entities ? blockSchema.entities.map((entitySchema) => {
                    return {
                        type: entitySchema.type,
                        entities: entitySchema.entities.map((elementSchema, idx: number) => {
                            const entity = {
                                type: elementSchema.type,
                                label: elementSchema.label,
                                nodeType: elementSchema.nodeType || elementSchema.markType,
                                attr: elementSchema.attr,
                                value: elementSchema.value ? elementSchema.value : '',
                                values: [] as {[x: string]: string | null}[],
                                checked: 'false',
                                tabindex: idx === 0 ? 0 : -1,
                                ariaLabel: elementSchema.ariaLabel,
                            };
                            if (elementSchema.type === 'setNodeType') {
                                entity.checked = elementSchema.nodeType && this.active[elementSchema.nodeType] ? 'true': 'false';
                            } else if (elementSchema.type === 'setNodeAttrValue') {
                                entity.checked = elementSchema.nodeType && elementSchema.attr && this.active[elementSchema.nodeType] && this.active[elementSchema.nodeType][elementSchema.attr] === elementSchema.value ? 'true' : 'false';
                            } else if (elementSchema.type === 'selectNodeAttr') {
                                entity.values = elementSchema.values.map((entry) => {
                                    return {
                                        value: entry.value,
                                        label: entry.label,
                                        checked: elementSchema.nodeType && elementSchema.attr && this.active[elementSchema.nodeType] && this.active[elementSchema.nodeType][elementSchema.attr] === entry.value ? 'selected' : null,
                                    };
                                });
                            } else if (elementSchema.type === 'selectMarkAttr') {
                                entity.values = elementSchema.values.map((entry) => {
                                    return {
                                        value: entry.value,
                                        label: entry.label,
                                        checked: elementSchema.markType && elementSchema.attr && this.active[elementSchema.markType] && this.active[elementSchema.markType][elementSchema.attr] === entry.value ? 'selected' : null,
                                    };
                                });
                            // } else if (elementSchema.type === 'editNestedDoc') {
                            } else if (elementSchema.type === 'linkNestedDoc') {
                                if (elementSchema.targetNodeType && this.nestedDocIds[elementSchema.targetNodeType]) {
                                    entity.values = this.nestedDocIds[elementSchema.targetNodeType].map((entry) => {
                                        return {
                                            value: entry.value,
                                            label: entry.label,
                                            checked: elementSchema.nodeType && elementSchema.attr && this.active[elementSchema.nodeType] && this.active[elementSchema.nodeType][elementSchema.attr] === entry.value ? 'selected' : null,
                                        };
                                    });
                                }
                            } else if (elementSchema.type === 'setNodeAttrString') {
                                entity.value = elementSchema.nodeType && this.active[elementSchema.nodeType] && this.active[elementSchema.nodeType][elementSchema.attr] ? this.active[elementSchema.nodeType][elementSchema.attr]: '';
                            }
                            return entity;
                        }),
                    }
                }) : [],
            }
        });
    }

    /**
     * Computed property to get the available nested doc ids.
     */
    public get nestedDocIds() {
        let nestedIds = {} as { [x: string]: TextEditorMenuItemValuesValue[] };
        Object.entries(this.$store.state.content[this.$props.section].nested).forEach(([nestedKey, docObj]: any) => {
            nestedIds[nestedKey] = Object.keys(docObj).map((docKey: string) => {
                return {
                    label: docKey,
                    value: docKey,
                };
            });
            nestedIds[nestedKey].splice(0, 0, {label: 'New', value: ''});
        });
        return nestedIds;
    }

    public mounted() {
        // Initialise the editor
        const component = this;
        this.editor = new EditorView(this.$el.querySelector('.editor') as Node, {
            state: EditorState.create({
                schema: this.editorSchema,
                doc: this.doc ? this.editorSchema.nodeFromJSON(this.doc) : null,
                plugins: this.editorPlugins,
            }),
            dispatchTransaction(transaction) {
                if (component.editor) {
                    let newState = component.editor.state.apply(transaction);
                    component.stateChanged(newState, transaction);
                    component.editor.updateState(newState);
                }
            },
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
            this.editor.updateState(EditorState.create({
                schema: this.editorSchema,
                doc: this.editorSchema.nodeFromJSON(this.doc),
                plugins: this.editorPlugins,
            }));
        }
        this.internalContentUpdate = false;
    }

    /**
     * Set a node attribute to the given value. Keeps all other attributes the same value.
     */
    /*public setNodeAttributeValue(commands: any, nodeName: string, attrName: string, value: string) {
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
     * Sets the mark's attribute value.
     */
    /*public setMarkAttributeValue(markName: string, attrName: string, value: string) {
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
    }*/

    // ==============
    // Event handlers
    // ==============

    public stateChanged(state: EditorState, transaction: Transaction) {
        if (this.stateDebounce !== null) {
            clearTimeout(this.stateDebounce);
        }
        this.stateDebounce = setTimeout(() => {
            const { from, to } = state.selection;
            const active: TextEditorActiveElements = {};
            state.doc.nodesBetween(from, to, (node) => {
                active[node.type.name] = node.attrs;
                if (node.marks) {
                    node.marks.forEach((mark) => {
                        if (mark.attrs) {
                            active[mark.type.name] = mark.attrs;
                        } else {
                            active[mark.type.name] = {};
                        }
                    });
                }
            });
            this.active = active;
        }, transaction.steps.length > 0 ? 500 : 50);
    }

    public setNodeType(menuItem: TextEditorMenuItem, event: Event) {
        if (this.editor) {
            if (menuItem.type === 'setNodeType' && menuItem.nodeType) {
                if (this.editorSchema.nodes[menuItem.nodeType].isInline) {
                    const slice = this.editor.state.selection.content();
                    if (this.active[menuItem.nodeType]) {
                        let fragment = slice.content.child(0).content;
                        // eslint-disable-next-line
                        console.log(fragment);
                        for (let idx = 0; idx < fragment.childCount; idx++) {
                            if (fragment.child(idx).type.name === menuItem.nodeType) {
                                fragment = fragment.replaceChild(idx, fragment.child(idx).content.child(0));
                            }
                        }
                        // eslint-disable-next-line
                        console.log(fragment);
                        this.editor.dispatch(this.editor.state.tr.replaceSelection(new Slice(fragment, slice.openStart, slice.openEnd)));
                    } else {
                        // eslint-disable-next-line
                        console.log(slice.content);
                        this.editor.dispatch(this.editor.state.tr.replaceSelection(new Slice(slice.content, slice.openStart, slice.openEnd)));
                        //this.editor.dispatch(this.editor.state.tr.replaceSelectionWith(this.editorSchema.nodes[menuItem.nodeType].create({}, slice.content.child(0).content.child(0))));
                    }
                } else {
                    setBlockType(this.editorSchema.nodes[menuItem.nodeType], {})(this.editor.state, this.editor.dispatch);
                }
            } else if ((menuItem.type === 'setNodeAttrValue' || menuItem.type === 'selectNodeAttr' || menuItem.type === 'setNodeAttrString') && menuItem.nodeType) {
                if (this.editorSchema.nodes[menuItem.nodeType].isInline) {
                    const state = this.editor.state;
                    const { selection } = state;
                    const { $from, $to, from, to } = selection;
                    let slice = $from.parent.slice($from.parentOffset, $to.parentOffset);
                    if (this.active[menuItem.nodeType]) {
                        let fragment = slice.content;
                        for (let idx = 0; idx < fragment.childCount; idx++) {
                            if (fragment.child(idx).type.name === menuItem.nodeType) {
                                fragment = fragment.replaceChild(idx, fragment.child(idx).content.child(0));
                            }
                        }
                        this.editor.dispatch(state.tr.replaceSelection(new Slice(fragment, slice.openStart, slice.openEnd)));
                    } else {
                        let attrs = {} as { [x: string]: string };
                        if (this.active[menuItem.nodeType]) {
                            attrs = deepclone(this.active[menuItem.nodeType]);
                        }
                        if (menuItem.attr) {
                            if (event && event.target) {
                                attrs[menuItem.attr] = (event.target as HTMLInputElement).value;
                            } else if (menuItem.value) {
                                attrs[menuItem.attr] = menuItem.value;
                            }
                        }
                        this.editor.dispatch(state.tr.replaceSelectionWith(this.editorSchema.nodes[menuItem.nodeType].create(attrs, slice.content)));
                    }
                } else {
                    let attrs = {} as { [x: string]: string };
                    if (this.active[menuItem.nodeType]) {
                        attrs = deepclone(this.active[menuItem.nodeType]);
                    }
                    if (menuItem.attr) {
                        if (event && event.target) {
                            attrs[menuItem.attr] = (event.target as HTMLInputElement).value;
                        } else if (menuItem.value) {
                            attrs[menuItem.attr] = menuItem.value;
                        }
                    }
                    setBlockType(this.editorSchema.nodes[menuItem.nodeType], attrs)(this.editor.state, this.editor.dispatch);
                }
            }
        }
    }

    /**
     * Open the nested editor.
     */
    /*public editNestedDoc(commands: any, nodeName: string, attrName: string, editNodeName: string) {
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
    /*public closeNestedEditor() {
        this.showNested = false;
        this.nestedSettings = null;
    }*/
}
</script>
