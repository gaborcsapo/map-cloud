import resolve from '@rollup/plugin-node-resolve';

export default [
    {
        input: 'public/scripts/simple.js',
        output: {
            file: 'dist/scripts/bundle.js',
            format: 'cjs'
        },
        plugins: [resolve()]
    },
];