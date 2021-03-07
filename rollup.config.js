import json from 'rollup-plugin-json'; //令rollup可以从json文件中读取数据
import { nodeResolve } from '@rollup/plugin-node-resolve';//处理node_modules里的包
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
// import typescript from '@rollup/plugin-typescript' //打包TS时需要的插件
import { terser } from "rollup-plugin-terser"; //生成环境使用
const env = false //开发环境不用开启 使用process.env

const rollupConfig = {
    input: 'src/main.js',
    output: {
        file: `dist/boundle.js`,
        name: 'rollpack', //打包的内容挂载到window name就是window的名称
        format: 'umd' //cjs esm
    },
    plugins: [ 
        // typescript(),
        json(),
        nodeResolve(),
        commonjs(),   //必须放在babel之前否则babel执行会出问题
        babel({ 
            babelHelpers: 'bundled',
            exclude: 'node_mooules/**',
            presets: [
            ['@babel/preset-env', {
                useBuiltIns: 'usage',
                corejs: 3,
                targets: {
                    chrome: 58,
                    ie: 11
                }
            }]
        ] }) ]
}

if(env) {
    rollupConfig.plugins.push(terser())
}

export default rollupConfig