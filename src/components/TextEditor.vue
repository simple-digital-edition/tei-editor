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
                                    <input v-if="menuitem.type === 'setNodeAttrString'" :value="menuitem.value" @change="menuAction(menuitem, $event)"/>
                                </label>
                            </li>
                        </ul>
                        <ul v-else-if="section.type === 'menubar'" :key="idx2" role="menubar">
                            <li v-for="(menuitem, idx3) in section.entities" :key="idx3" role="presentation" :class="menuitem.type === 'separator' ? 'separator' : null">
                                <a v-if="menuitem.type === 'setNodeType'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="menuAction(menuitem)"></a>
                                <a v-else-if="menuitem.type === 'setNodeAttrValue'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="menuAction(menuitem)"></a>
                                <select v-else-if="menuitem.type === 'selectNodeAttr'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="menuAction(menuitem, $event)">
                                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                                </select>
                                <a v-else-if="menuitem.type === 'toggleMark'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" :aria-checked="menuitem.checked" @keyup="keyboardNav" @click="menuAction(menuitem)"></a>
                                <select v-else-if="menuitem.type === 'selectMarkAttr'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="menuAction(menuitem, $event)">
                                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                                </select>
                                <a v-else-if="menuitem.type === 'editNestedDoc'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" @keyup="keyboardNav" @click="menuAction(menuitem)"></a>
                                <a v-else-if="menuitem.type === 'closeNested'" role="menuitem" v-html="menuitem.label" :tabindex="menuitem.tabindex" :aria-label="menuitem.ariaLabel" :title="menuitem.ariaLabel" @keyup="keyboardNav" @click="$emit('close')"></a>
                                <select v-else-if="menuitem.type === 'linkNestedDoc'" role="menuitem" :tabindex="menuitem.tabindex" @keyup="keyboardNav" @change="menuAction(menuitem, $event)">
                                    <option v-for="value in menuitem.values" :key="value.value" v-html="value.label" :value="value.value" :selected="value.checked"></option>
                                </select>
                            </li>
                        </ul>
                    </template>
                </div>
            </div>
        </aria-menubar>
        <div v-if="showNested" class="nested">
            <text-editor :config="config" v-model="nestedDocs[nestedSettings.type][nestedSettings.id].content[0]" :nestedDocs="nestedDocs" :nested="nestedSettings" @close="closeNestedEditor"/>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { Schema, Fragment, Slice, Node as ProsemirrorNode } from "prosemirror-model";
import { EditorState, Transaction, Selection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { baseKeymap, setBlockType, toggleMark } from 'prosemirror-commands';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import AriaMenubar from './AriaMenubar.vue';
import get from '../util/get';
import deepclone from '../util/deepclone';
import { generateSchemaNodes, generateSchemaMarks, updateMark, removeMark, updateInlineNode, wrapNode, unwrapNode, isWrappedNode } from '../util/prosemirror';
import { TextSection, TextEditorActiveElements, TextEditorSidebarBlockConfig, TextEditorMenuItem, TextEditorMenuItemValuesValue } from '../interfaces';

/**
 * The TextEditor component wraps a single prosemirror editor. It supports nested documents.
 */
@Component({
    components: {
        AriaMenubar,
    },
    name: 'text-editor',
})
export default class TextEditor extends Vue {
    @Prop() public config!: TextSection;
    @Prop() public value!: any;
    @Prop() public nestedDocs!: {[x: string]: {[y: string]: any}};
    @Prop() public nested!: {type: string, id: string};

    public editor: EditorView | null = null;
    public showNested = false;
    public nestedSettings = null as any;
    public stateDebounce: number | null = null
    public internalUpdate = false;
    public active = {} as TextEditorActiveElements;

    // ===================
    // Computed properties
    // ===================

    /**
     * Get the schema for the editor.
     */
    public get editorSchema() {
        return new Schema({
            nodes: generateSchemaNodes(this.config.schema),
            marks: generateSchemaMarks(this.config.schema),
        });
    }

    /**
     * Get the plugins for the editor.
     */
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

    /**
     * Get the currently active UI (main document or nested document).
     */
    public get ui() {
        if (this.nested) {
            return this.config.ui[this.nested.type];
        } else {
            return this.config.ui.doc;
        }
    }

    /**
     * Gets the sidebar menu elements.
     */
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
                                targetNodeType: elementSchema.targetNodeType,
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
                            } else if (elementSchema.type === 'toggleMark') {
                                entity.checked = elementSchema.markType && this.active[elementSchema.markType] ? 'true' : 'false';
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
     * Gets all nested document ids.
     */
    public get nestedDocIds() {
        let nestedIds = {} as { [x: string]: TextEditorMenuItemValuesValue[] };
        Object.entries(this.nestedDocs).forEach(([nestedKey, docObj]: any) => {
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

    // ================
    // Lifecycle events
    // ================

    /**
     * Mount a new TextEditor, initialising the prosemirror editor.
     */
    public mounted() {
        this.editor = new EditorView(this.$el.querySelector('.editor') as Node, {
            state: EditorState.create({
                schema: this.editorSchema,
                doc: this.value ? this.editorSchema.nodeFromJSON(this.value) : null,
                plugins: this.editorPlugins,
            }),
            dispatchTransaction: (transaction) => {
                if (this.editor) {
                    let newState = this.editor.state.apply(transaction);
                    this.stateChanged(newState, transaction);
                    this.editor.updateState(newState);
                }
            },
        });
    }

    /**
     * Destroy the prosemirror editor before destroying the component.
     */
    public beforeDestroy() {
        if (this.editor) {
            this.editor.destroy();
        }
    }

    /**
     * Update the editor state if the value changes externaly.
     */
    @Watch('value')
    public updatedDoc() {
        if (!this.internalUpdate && this.editor) {
            this.editor.updateState(EditorState.create({
                schema: this.editorSchema,
                doc: this.editorSchema.nodeFromJSON(this.value),
                plugins: this.editorPlugins,
            }));
        }
        this.internalUpdate = false;
    }

    // ==============
    // Event handlers
    // ==============

    /**
     * Debounced Prosemirror state-change handler updates the menu and emits the input event
     * with the current document state as JSON.
     */
    public stateChanged(state: EditorState, transaction: Transaction) {
        if (this.stateDebounce !== null) {
            clearTimeout(this.stateDebounce);
        }
        this.stateDebounce = window.setTimeout(() => {
            const { from, to, empty, $from } = state.selection;
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
            if (empty) {
                active[$from.parent.type.name] = $from.parent.attrs;
                if ((state.selection as TextSelection).$cursor && (state.selection as TextSelection).$cursor.marks()) {
                    (state.selection as TextSelection).$cursor.marks().forEach((mark) => {
                        if (mark.attrs) {
                            active[mark.type.name] = mark.attrs;
                        } else {
                            active[mark.type.name] = {};
                        }
                    });
                }
            }
            this.active = active;
            this.internalUpdate = true;
            this.$emit('input', state.doc.toJSON());
        }, transaction.steps.length > 0 ? 500 : 50);
    }

    /**
     * Handle all sidebar menu actions
     */
    public menuAction(menuItem: TextEditorMenuItem, event: Event) {
        if (this.editor) {
            // Set the block or inline Node type
            if (menuItem.type === 'setNodeType' && menuItem.nodeType) {
                if (this.editorSchema.nodes[menuItem.nodeType].isInline) {
                    const slice = this.editor.state.selection.content();
                    if (this.active[menuItem.nodeType]) {
                        const nodeCallback = (node: ProsemirrorNode) => {
                            if (node.type.isBlock) {
                                return this.editorSchema.nodes[node.type.name].create({}, this.walkFragment(node.content, nodeCallback));
                            } else if (node.type.isInline && node.type.name === menuItem.nodeType) {
                                return this.editorSchema.text(node.textContent);
                            } else {
                                return node;
                            }
                        }
                        const fragment = this.walkFragment(slice.content, nodeCallback);
                        this.editor.dispatch(this.editor.state.tr.replaceSelection(new Slice(fragment, slice.openStart, slice.openEnd)));
                    } else {
                        const nodeCallback = (node: ProsemirrorNode) => {
                            if (node.type.isBlock) {
                                return this.editorSchema.nodes[node.type.name].create(node.attrs, this.walkFragment(node.content, nodeCallback));
                            } else if (node.type.isText && menuItem.nodeType) {
                                return this.editorSchema.nodes[menuItem.nodeType].create({}, node);
                            } else if (node.type.isInline && menuItem.nodeType) {
                                return this.editorSchema.nodes[menuItem.nodeType].create(node.attrs, node.content);
                            } else {
                                return node;
                            }
                        }
                        const fragment = this.walkFragment(slice.content, nodeCallback);
                        this.editor.dispatch(this.editor.state.tr.replaceSelection(new Slice(fragment, slice.openStart, slice.openEnd)));
                    }
                } else {
                    if (this.isWrappingType(menuItem.nodeType)) {
                        let contentNodeType = '';
                        for (let idx = 0; idx < this.config.schema.length; idx++) {
                            if (this.config.schema[idx].name === menuItem.nodeType && this.config.schema[idx].type === 'wrapping') {
                                contentNodeType = this.config.schema[idx].content as string;
                            }
                        }
                        wrapNode(this.editorSchema.nodes[menuItem.nodeType], this.editorSchema.nodes[contentNodeType])(this.editor.state, this.editor.dispatch);
                    } else {
                        if (isWrappedNode(this.editor.state, this.config.schema, this.editorSchema)) {
                            unwrapNode(this.editorSchema.nodes[menuItem.nodeType])(this.editor.state, this.editor.dispatch)
                        } else {
                            setBlockType(this.editorSchema.nodes[menuItem.nodeType], {})(this.editor.state, this.editor.dispatch);
                        }
                    }
                }
            // Set an attribute value on a Node
            } else if ((menuItem.type === 'setNodeAttrValue' || menuItem.type === 'selectNodeAttr' || menuItem.type === 'setNodeAttrString') && menuItem.nodeType) {
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
                if (this.editorSchema.nodes[menuItem.nodeType].isInline) {
                    updateInlineNode(this.editorSchema.nodes[menuItem.nodeType], attrs)(this.editor.state, this.editor.dispatch);
                } else {
                    setBlockType(this.editorSchema.nodes[menuItem.nodeType], attrs)(this.editor.state, this.editor.dispatch);
                }
            // Toggle a mark on or off
            } else if (menuItem.type === 'toggleMark' && menuItem.nodeType) {
                toggleMark(this.editorSchema.marks[menuItem.nodeType])(this.editor.state, this.editor.dispatch);
            // Set an attribute on a mark
            } else if (menuItem.type === 'selectMarkAttr' && menuItem.nodeType) {
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
                if (attrs[menuItem.attr] === '') {
                    removeMark(this.editorSchema.marks[menuItem.nodeType])(this.editor.state, this.editor.dispatch);
                } else {
                    updateMark(this.editorSchema.marks[menuItem.nodeType], attrs)(this.editor.state, this.editor.dispatch);
                }
            // Link to a nested docs
            } else if (menuItem.type === 'linkNestedDoc' && menuItem.nodeType) {
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
                updateInlineNode(this.editorSchema.nodes[menuItem.nodeType], attrs)(this.editor.state, this.editor.dispatch);
            // Edit a nested doc
            } else if (menuItem.type === 'editNestedDoc') {
                if (menuItem.nodeType && menuItem.attr && menuItem.targetNodeType && this.active[menuItem.nodeType]) {
                    let nestedId = this.active[menuItem.nodeType][menuItem.attr];
                    if (!nestedId) {
                        const docList = this.nestedDocs[menuItem.targetNodeType];
                        nestedId = menuItem.targetNodeType + '-1';
                        let idx = 1;
                        while (docList && docList[nestedId]) {
                            idx = idx + 1;
                            nestedId = menuItem.targetNodeType + '-' + idx;
                        }
                        let attrs = {} as { [x: string]: string };
                        if (this.active[menuItem.nodeType]) {
                            attrs = deepclone(this.active[menuItem.nodeType]);
                        }
                        if (menuItem.attr) {
                            attrs[menuItem.attr] = nestedId;
                        }
                        updateInlineNode(this.editorSchema.nodes[menuItem.nodeType], attrs)(this.editor.state, this.editor.dispatch);
                        Vue.set(this.nestedDocs[menuItem.targetNodeType], nestedId, {type: 'doc', content: [{type: 'paragraph', content: []}]})
                    }
                    this.showNested = true;
                    this.nestedSettings = {
                        type: menuItem.targetNodeType,
                        id: nestedId,
                    }
                }
            }
            this.editor.focus();
        }
    }

    /**
     * Close the nested editor.
     */
    public closeNestedEditor() {
        this.showNested = false;
        this.nestedSettings = null;
    }

    // ===============
    // Private Helpers
    // ===============

    /**
     * Walks over the Fragment, replacing the children according to the callback.
     */
    private walkFragment(fragment: Fragment, callback: (x: ProsemirrorNode) => ProsemirrorNode) {
        for (let idx = 0; idx < fragment.childCount; idx++) {
            fragment = fragment.replaceChild(idx, callback(fragment.child(idx)));
        }
        return fragment;
    }

    /**
     * Checks whether the given typeName is a wrapping node.
     */
    private isWrappingType(typeName: string) {
        for (let idx = 0; idx < this.config.schema.length; idx++) {
            if (this.config.schema[idx].name === typeName && this.config.schema[idx].type === 'wrapping') {
                return true;
            }
        }
        return false;
    }
}
</script>
