export default function and(params) {
    for (let idx = 0; idx < params.length; idx++) {
        if (!params[idx]) {
            return false;
        }
    }
    return true;
}
