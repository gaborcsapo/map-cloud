import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        onwarn(warning, rollupWarn) {
            if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                rollupWarn(warning);
            }
        },
        input: 'public/controllers/mainApp.js',
        output: {
            file: 'dist/scripts/main-app-bundle.js',
            format: 'cjs'
        },
        plugins: [
            resolve({
                browser: true,
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
        input: 'public/controllers/POSApp.js',
        output: {
            file: 'dist/scripts/POSApp.js',
            format: 'cjs'
        },
        plugins: [
            resolve({
                browser: true,
            }),
            commonjs()
        ]
    },
];