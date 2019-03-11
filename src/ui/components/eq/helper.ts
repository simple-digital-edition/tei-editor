export default function eq(params) {
    if (params[1] === 'toggle') {
        return params[0] !== undefined && params[0] !== null;
    } else {
        return params[0] === params[1];
    }
}
