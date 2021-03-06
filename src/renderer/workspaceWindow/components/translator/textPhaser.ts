// Thanks to CopyTranslator
import { compact, join, trim } from 'lodash';
const tokenizer = require('sbd');
const optional_options = {};
export function phaseText(text: string): string[] {
    return compact(tokenizer.sentences(text.replace(/\n/g, ' ').trim(), optional_options));
}
export function translate(textArray: string[]): Promise<string> {
    const txt = join(textArray, ' ').replace('- ', '');
    return new Promise((resolve, reject) => {
        console.log('Translate:', txt);
    });
}
