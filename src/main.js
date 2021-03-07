import foo  from './index'
import { version } from '../package.json';
import answer from 'the-answer';
import { deepClone } from  './deep-clone'


export  default function() {
    console.log(foo, answer)
    console.log('version ' + version);
}

const newObj = deepClone({a:1})

console.log(newObj)