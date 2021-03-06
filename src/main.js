import foo  from './index'
import { version } from '../package.json';
import answer from 'the-answer';


export  default function() {
    console.log(foo, answer)
    console.log('version ' + version);
}