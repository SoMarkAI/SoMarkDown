export const isString = (val) => typeof val === 'string';
export const isObject = (val) => val !== null && typeof val === 'object';

export const encodeBase64 = (str) => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
    }
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
};

export const decodeBase64 = (str) => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'base64').toString();
    }
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
};
