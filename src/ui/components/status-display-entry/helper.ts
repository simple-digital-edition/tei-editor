import get from '../get/helper';

export default function statusDisplayEntry(params) {
    let status = params[0];
    let test = params[1];
    if (status && test) {
        if (typeof test === 'string') {
            return get([status, test]);
        } else if(test.key && test.value) {
            return get([status, test.key]) === test.value;
        }
    } else if (status && !test) {
        return true;
    }
    return false;
}
