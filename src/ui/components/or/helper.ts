export default function or(params) {
    for (let idx = 0; idx < params.length; idx++) {
        if (params[idx]) {
            return true;
        }
    }
    return false;
}
