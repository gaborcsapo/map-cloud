import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import mustache from 'rollup-plugin-mustache'

export default [
    {
        onwarn(warning, rollupWarn) {
            if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                rollupWarn(warning);
            }
        },
        input: 'public/scripts/playerApp.js',
        output: {
            file: 'dist/scripts/player-app-bundle.js',
            format: 'cjs'
        },
        plugins: [
            resolve({
                browser: true,
            }),
            mustache({
                include: 'public/views/*.mustache'
            }),
            commonjs()
        ]
    },
    {
        onwarn(warning, rollupWarn) {
            if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                rollupWarn(warning);
            }
        },
        input: 'public/scripts/editorApp.js',
        output: {
            file: 'dist/scripts/editor-app-bundle.js',
            format: 'cjs'
        },
        plugins: [
            resolve({
                browser: true,
            }),
            mustache({
                include: 'public/views/*.mustache'
            }),
            commonjs()
        ]
    },
    {
        onwarn(warning, rollupWarn) {
            if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                rollupWarn(warning);
            }
        },
        input: 'public/scripts/homeApp.js',
        output: {
            file: 'dist/scripts/home-app-bundle.js',
            format: 'cjs'
        },
        plugins: [
            resolve({
                browser: true,
            }),
            mustache({
                include: 'public/views/*.mustache'
            }),
            commonjs()
        ]
    },
];