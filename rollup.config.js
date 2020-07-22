import typescript from 'rollup-plugin-typescript2';
import VuePlugin from 'rollup-plugin-vue';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/index.cjs.js',
        format: 'cjs'
    },
    plugins: [
        typescript(),
        VuePlugin(),
    ],
    external: [
        'axios',
        'vue',
        'vue-property-decorator',
        'prosemirror-model',
        'prosemirror-state',
        'prosemirror-view',
        'prosemirror-commands',
        'prosemirror-history',
        'prosemirror-keymap',
        'prosemirror-utils',
        'prosemirror-transform',
    ]
};
