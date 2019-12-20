export default function get(obj, path) {
    path = path.split('.');
    while (obj && path.length > 0) {
        obj = obj[path[0]];
        path = path.slice(1);
    }
    return obj;
}
