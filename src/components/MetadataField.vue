<template>
  <div>
    <template v-if="config.type == 'single-text'">
      <label>{{ config.label }}
        <input type="text" :value="value" @change="update"/>
      </label>
    </template>
    <template v-if="config.type == 'multi-row'">
      <ol class="multi-row">
        <li v-for="(data, idx) in value" :key="idx">
          <metadata-field v-for="(entry, idx2) in config.entries" :config="entry" :parent="parent + config.path + '.[' + idx + ']'" :key="idx2"/>
          <aria-menubar :items="modifyMenuItems(idx)" @action="menuAction"/>
        </li>
      </ol>
      <aria-menubar :items="addMenuItems" @action="menuAction"/>
    </template>
    <template v-if="config.type == 'multi-field'">
      <ol class="multi-field">
        <li v-for="(entry, idx) in config.entries" :key="idx">
          <metadata-field :config="entry" :parent="parent + config.path"/>
        </li>
      </ol>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AriaMenubar from './AriaMenubar.vue';
import get from '@/util/get';
import { MenuItem } from '@/interfaces';


@Component({
    components: {
        AriaMenubar,
    },
    props: {
        config: Object,
        parent: {
            type: String,
            default: '',
        },
    }
})
export default class MetadataField extends Vue {
    addMenuItems = [
        {
            label: '<svg viewBox="0 0 24 24" aria-label="Add"><path d="M17,13H13V17H11V13H7V11H11V7H13V11H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" /></svg>',
            action: 'add',
        },
    ];

    get value() {
        let value = get(this.$store.state.data[this.$store.state.settings.metadataSection], this.$props.parent + this.$props.config.path);
        if (value) {
            return value;
        } else {
            return '';
        }
    }

    public update(ev: Event) {
        if (ev && ev.target) {
            this.$store.commit('setMetadataValue', {path: this.$props.parent + this.$props.config.path, value: (ev.target as HTMLInputElement).value});
        }
    }

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
                disabled: idx === this.value.length - 1,
            },
            {
                label: '<svg viewBox="0 0 24 24" aria-label="Delete"><path d="M17,13H7V11H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" /></svg>',
                action: 'delete:' + idx,
            },
        ];
    }

    public menuAction(name: string) {
        if (name === 'add') {
            // Construct the empty data structure for the new value to add
            let value = {} as any;
            this.$props.config.entries.forEach((entry: any) => {
                let path = entry.path;
                if (path[0] === '.') {
                    path = path.substring(1);
                }
                if (entry.type === 'single-text') {
                    value[path] = '';
                } else if (entry.type === 'multi-row') {
                    value[path] = [];
                } else if (entry.type === 'multi-field') {
                    entry.entries.forEach((entry: any) => {
                        let path = entry.path;
                        if (path[0] === '.') {
                            path = path.substring(1);
                        }
                        if (entry.type === 'single-text') {
                            value[path] = '';
                        } else if (entry.type === 'multi-row') {
                            value[path] = [];
                        }
                    });
                }
            });
            this.$store.commit('addMetadataMuliRow', {
                path: this.$props.parent + this.$props.config.path,
                value: value,
            })
        } else if (name.indexOf('move-up:') === 0) {
            this.$store.commit('moveMetadataMultiRow', {
                path: this.$props.parent + this.$props.config.path,
                idx: Number.parseInt(name.substring(8)),
                move: -1,
            });
        } else if (name.indexOf('move-down:') === 0) {
            this.$store.commit('moveMetadataMultiRow', {
                path: this.$props.parent + this.$props.config.path,
                idx: Number.parseInt(name.substring(10)),
                move: 1,
            });
        } else if (name.indexOf('delete:') === 0) {
            this.$store.commit('removeMetadataMultiRow', {
                path: this.$props.parent + this.$props.config.path,
                value: Number.parseInt(name.substring(7))
            })
        }
    }
}
</script>
