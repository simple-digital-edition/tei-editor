export default function get(params) {
    let obj = params[0];
    let path = params[1].split('.');
    while (obj && path.length > 0) {
        obj = obj[path[0]];
        path = path.slice(1);
    }
    return obj;
}
