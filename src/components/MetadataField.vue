<template>
  <div>
    <template v-if="config.type == 'single-text'">
      <label>{{ config.label }}
        <input type="text" :value="value" @change="update"/>
      </label>
    </template>
    <template v-if="config.type == 'multi-row'">
      <ol>
        <li v-for="(data, idx) in value" :key="idx">
          <metadata-field v-for="(entry, idx2) in config.entries" :config="entry" :parent="parent + config.path + '.[' + idx + ']'" :key="idx2"/>
          <aria-menubar :items="modifyMenuItems(idx)" @action="menuAction"/>
        </li>
      </ol>
      <aria-menubar :items="addMenuItems" @action="menuAction"/>
    </template>
    <template v-if="config.type == 'multi-field'">
      <ol>
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
            label: 'Add',
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
                label: 'Up',
                action: 'move-up:' + idx,
                disabled: idx === 0,
            },
            {
                label: 'Down',
                action: 'move-down:' + idx,
                disabled: idx === this.value.length - 1,
            },
            {
                label: 'Delete',
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
