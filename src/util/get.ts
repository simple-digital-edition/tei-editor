export default function get(obj: any, path: string) {
    let pathElements = path.split('.');
    while (obj && pathElements.length > 0) {
        obj = obj[pathElements[0]];
        pathElements = pathElements.slice(1);
    }
    return obj;
}
