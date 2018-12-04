export default function eq(params) {
    if (!params[2]) {
        if (params[1] === 'toggle') {
            return params[0] !== undefined && params[0] !== null;
        } else {
            return params[0] === params[1];
        }
    } else {
        if (eq(params.slice(0, params.length - 1))) {
            return 'true';
        } else {
            return 'false';
        }
    }
}
