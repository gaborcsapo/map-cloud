import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        onwarn(warning, rollupWarn) {
            if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                rollupWarn(warning);
            }
        },
        input: 'public/controllers/fam.js',
        output: {
            file: 'dist/scripts/fam-bundle.js',
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
        input: 'public/controllers/home.js',
        output: {
            file: 'dist/scripts/home.js',
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