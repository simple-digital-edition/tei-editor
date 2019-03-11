/**
 * Recursively clone the object.
 */
function recursive_clone(obj) {
    if (obj === undefined) {
        return undefined;
    } else if (obj === null) {
        return null;
    } else if (Array.isArray(obj)) {
        return obj.slice();
    } else if (typeof(obj) === 'object') {
        let clone = {};
        Object.keys(obj).forEach(function(key) {
            clone[key] = recursive_clone(obj[key]);
        });
        return clone;
    } else {
        return obj;
    }
}

/**
 * Performs a deep cloning of the first element of the parameters.
 */
export default function deepclone(params) {
    return recursive_clone(params[0]);
}
