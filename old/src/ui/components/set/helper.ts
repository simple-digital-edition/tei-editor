/**
 * Sets the third parameter value identified by the path in the second parameter value in the first parameter value .
 */
export default function set(params) {
    let clone = params[0];
    let path = params[1].split('.');
    let current = clone;
    while (path.length > 0) {
        if (path.length > 1) {
            if (!current[path[0]]) {
                current[path[0]] = {};
            }
            current = current[path[0]];
        } else {
            current[path[0]] = params[2];
        }
        path.splice(0, 1);
    }
    return clone;
}
