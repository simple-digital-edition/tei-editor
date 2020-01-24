/**
 * Performs a deep cloning of the first element of the parameters.
 */
export default function deepclone(obj: any): any {
    if (obj === undefined) {
        return undefined;
    } else if (obj === null) {
        return null;
    } else if (Array.isArray(obj)) {
        return obj.map((val) => {
            return deepclone(val);
        });
    } else if (typeof(obj) === 'object') {
        let clone = <any>{};
        Object.keys(obj).forEach(function(key) {
            clone[key] = deepclone(obj[key]);
        });
        return clone;
    } else {
        return obj;
    }
}
