export const deepClone = function(item) {
    let result;
    if (typeof item === 'object') {
        result = Array.isArray(item) ? [] : {}
        for(let key in item) {
            result[key] = typeof item[key] === 'object' ? deepClone(item[key]) : item[key]
        }
    } else {
        result = item
    }

    return result
}