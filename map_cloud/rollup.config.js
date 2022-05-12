import resolve from '@rollup/plugin-node-resolve';

export default [
    {
        input: 'scripts/simple.js',
        output: {
            file: 'public/scripts/bundle.js',
            format: 'cjs'
        },
        plugins: [resolve()]
    },
    // {
    //     input: 'scripts/simple.js',
    //     output: {
    //         file: 'public/scripts/bundle.js',
    //         format: 'cjs'
    //     },
    //     plugins: [resolve()]
    // },
];