<template>
    <div class="metadata-editor">
        <section v-for="(section, idx) in config.ui" :key="idx">
            <h2>{{ section.label }}</h2>
            <div v-for="(entry, idx2) in section.entries" :key="idx2">
                <metadata-field :config="entry" :value="value"/>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import MetadataField from './MetadataField.vue';

import { MetadataSection } from '@/interfaces';

@Component({
    components: {
        MetadataField,
    },
})
export default class MetadataEditor extends Vue {
    @Prop() public config!: MetadataSection;
    @Prop() public value!: any;
}
</script>
