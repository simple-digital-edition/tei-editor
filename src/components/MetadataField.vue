<template>
    <div>
        <template v-if="config.type == 'single-text'">
            <label><span class="label-text">{{ config.label }}</span>
                <input type="text" v-model="localValue"/>
            </label>
        </template>
        <template v-else-if="config.type == 'multi-row'">
            <ol class="multi-row">
                <li v-for="(data, idx) in localValue" :key="idx">
                    <metadata-field v-for="(entry, idx2) in config.entries" :config="entry" :value="data" :key="idx2"/>
                    <aria-menubar :items="modifyMenuItems(idx)" @action="menuAction"/>
                    <aria-menubar v-slot="{ keyboardNav }">
                        <ul role="menubar">
                            <li role="presentation">
                                <a v-if="idx === 0" role="menuitem" :aria-disabled="true"><svg viewBox="0 0 24 24" aria-label="Move up"><path d="M19,3H5A2,2 0 0,0 3,5V19C3,20.11 3.9,21 5,21H19C20.11,21 21,20.11 21,19V5A2,2 0 0,0 19,3M16.59,15.71L12,11.12L7.41,15.71L6,14.29L12,8.29L18,14.29L16.59,15.71Z" /></svg></a>
                                <a v-else role="menuitem" @click="menuAction('move-up:' + idx)" @keyup="keyboardNav" :tabindex="value.length === 1 ? null : 0"><svg viewBox="0 0 24 24" aria-label="Move up"><path d="M19,3H5A2,2 0 0,0 3,5V19C3,20.11 3.9,21 5,21H19C20.11,21 21,20.11 21,19V5A2,2 0 0,0 19,3M16.59,15.71L12,11.12L7.41,15.71L6,14.29L12,8.29L18,14.29L16.59,15.71Z" /></svg></a>
                            </li>
                            <li role="presentation">
                                <a v-if="idx === localValue.length - 1" role="menuitem" :aria-disabled="true"><svg viewBox="0 0 24 24" aria-label="Move down"><path d="M19,3H5A2,2 0 0,0 3,5V19C3,20.11 3.9,21 5,21H19C20.11,21 21,20.11 21,19V5A2,2 0 0,0 19,3M12,15.71L6,9.71L7.41,8.29L12,12.88L16.59,8.29L18,9.71L12,15.71Z" /></svg></a>
                                <a v-else role="menuitem" @click="menuAction('move-down:' + idx)" @keyup="keyboardNav" :tabindex="value.length === 1 ? null : 0"><svg viewBox="0 0 24 24" aria-label="Move down"><path d="M19,3H5A2,2 0 0,0 3,5V19C3,20.11 3.9,21 5,21H19C20.11,21 21,20.11 21,19V5A2,2 0 0,0 19,3M12,15.71L6,9.71L7.41,8.29L12,12.88L16.59,8.29L18,9.71L12,15.71Z" /></svg></a>
                            </li>
                            <li role="presentation">
                                <a role="menuitem" @click="menuAction('delete:' + idx)" @keyup="keyboardNav" :tabindex="value.length === 1 ? 0 : -1"><svg viewBox="0 0 24 24" aria-label="Delete"><path d="M17,13H7V11H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" /></svg></a>
                            </li>
                        </ul>
                    </aria-menubar>
                </li>
            </ol>
            <aria-menubar v-slot="{ keyboardNav }">
                <ul role="menubar">
                    <li role="presentation">
                        <a role="menuitem" tabindex="0" @click="menuAction('add')" @keyup="keyboardNav"><svg viewBox="0 0 24 24" aria-label="Add"><path d="M17,13H13V17H11V13H7V11H11V7H13V11H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" /></svg></a>
                    </li>
                </ul>
            </aria-menubar>
        </template>
        <template v-if="config.type == 'multi-field'">
            <ol class="multi-field">
                <li v-for="(entry, idx) in config.entries" :key="idx">
                    <metadata-field :config="entry" :value="value"/>
                </li>
            </ol>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import AriaMenubar from './AriaMenubar.vue';

import { MetadataSectionUIElement, MetadataBlock } from '@/interfaces';
import get from '@/util/get';


/**
 * The MetadataField component implements the individual metadata editing UI elements. It implements the
 * v-model VueJS pattern. Three types of MetadataField are supported: single-text, multi-row, and multi-field.
 */
@Component({
    components: {
        AriaMenubar,
    },
    name: 'metadata-field',
})
export default class MetadataField extends Vue {
    @Prop() public config!: MetadataSectionUIElement;
    @Prop() public value!: MetadataBlock;
    public addMenuItems = [
        {
            label: '<svg viewBox="0 0 24 24" aria-label="Add"><path d="M17,13H13V17H11V13H7V11H11V7H13V11H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" /></svg>',
            action: 'add',
        },
    ];

    // ===================
    // Computed properties
    // ===================

    /**
     * Gets the actual value for this MetadataField. This is needed as the value contains a tree structure and the configuration
     * specifies the specific value for this MetadataField in that tree.
     */
    public get localValue(): string | {[x: string]: string} | MetadataBlock | MetadataBlock[] {
        return get(this.value, this.config.path);
    }

    /**
     * Sets the value for this MetadataField.
     */
    public set localValue(value: string | {[x: string]: string} | MetadataBlock | MetadataBlock[]) {
        const pathElements = this.config.path.split('.');
        if (pathElements.length === 1) {
            Vue.set(this.value, pathElements[0], value);
        } else {
            Vue.set(get(this.value, pathElements.slice(0, pathElements.length - 1).join('.')), pathElements[pathElements.length - 1], value);
        }
    }

    /**
     * Returns the menu items for manipulating rows in a multi-row MetadataField.
     */
    public modifyMenuItems(idx: number) {
        return [
            {
                label: '<svg viewBox="0 0 24 24" aria-label="Move up"><path d="M19,3H5A2,2 0 0,0 3,5V19C3,20.11 3.9,21 5,21H19C20.11,21 21,20.11 21,19V5A2,2 0 0,0 19,3M16.59,15.71L12,11.12L7.41,15.71L6,14.29L12,8.29L18,14.29L16.59,15.71Z" /></svg>',
                action: 'move-up:' + idx,
                disabled: idx === 0,
            },
            {
                label: '<svg viewBox="0 0 24 24" aria-label="Move down"><path d="M19,3H5A2,2 0 0,0 3,5V19C3,20.11 3.9,21 5,21H19C20.11,21 21,20.11 21,19V5A2,2 0 0,0 19,3M12,15.71L6,9.71L7.41,8.29L12,12.88L16.59,8.29L18,9.71L12,15.71Z" /></svg>',
                action: 'move-down:' + idx,
                disabled: idx === (this.localValue as MetadataBlock[]).length - 1,
            },
            {
                label: '<svg viewBox="0 0 24 24" aria-label="Delete"><path d="M17,13H7V11H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" /></svg>',
                action: 'delete:' + idx,
            },
        ];
    }

    /**
     * Handle the menu actions for a multi-row MetadataField.
     */
    public menuAction(name: string) {
        if (name === 'add') {
            // Construct the empty data structure for the new value to add
            let value = {} as any;
            if (this.config.entries) {
                this.config.entries.forEach((entry: any) => {
                    let path = entry.path;
                    if (entry.type === 'single-text') {
                        value[path] = '';
                    } else if (entry.type === 'multi-row') {
                        value[path] = [];
                    } else if (entry.type === 'multi-field') {
                        entry.entries.forEach((entry: any) => {
                            let path = entry.path;
                            if (entry.type === 'single-text') {
                                const pathElements = path.split('.')
                                let tmp = value;
                                for (let idx = 0; idx < pathElements.length; idx++) {
                                    if (idx < pathElements.length - 1) {
                                        tmp[pathElements[idx]] = {};
                                        tmp = tmp[pathElements[idx]];
                                    } else {
                                        tmp[pathElements[idx]] = '';
                                    }
                                }
                            } else if (entry.type === 'multi-row') {
                                value[path] = [];
                            }
                        });
                    }
                });
            }
            (this.localValue as MetadataBlock[]).push(value);
        } else if (name.indexOf('move-up:') === 0) {
            const idx = Number.parseInt(name.substring(8));
            const tmp = (this.localValue as MetadataBlock[]).splice(idx, 1);
            (this.localValue as MetadataBlock[]).splice(idx - 1, 0, tmp[0]);
        } else if (name.indexOf('move-down:') === 0) {
            const idx = Number.parseInt(name.substring(10));
            const tmp = (this.localValue as MetadataBlock[]).splice(idx + 1, 1);
            (this.localValue as MetadataBlock[]).splice(idx, 0, tmp[0]);
        } else if (name.indexOf('delete:') === 0) {
            (this.localValue as MetadataBlock[]).splice(Number.parseInt(name.substring(7)), 1);
        }
    }
}
</script>
