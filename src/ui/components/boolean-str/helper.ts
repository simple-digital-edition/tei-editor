/**
 * Converts the first parameter into a boolean string "true"/"false".
 */
export default function booleanStr(params) {
    if (params[0]) {
        return 'true';
    } else {
        return 'false';
    }
}
