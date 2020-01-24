export default function get(obj: any, path: string) {
    let pathElements = path.split('.');
    while (obj && pathElements.length > 0) {
        if (pathElements[0][0] === '[' && pathElements[0][pathElements[0].length - 1] === ']') {
            let idx = Number.parseInt(pathElements[0].substring(1, pathElements[0].length - 1));
            if (idx >= 0 && idx < obj.length) {
                obj = obj[idx];
            }
        } else {
            obj = obj[pathElements[0]];
        }
        pathElements = pathElements.slice(1);
    }
    return obj;
}
