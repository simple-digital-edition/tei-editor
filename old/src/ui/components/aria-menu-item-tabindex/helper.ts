export default function ariaMenuItemTabindex(params) {
    if (params[0] === 0) {
        return 0;
    } else {
        return -1;
    }
}
