// utils/phoneParser.js
const { parsePhoneNumberFromString } = require('libphonenumber-js');

/**
 * parsePhoneNumber(phone) => {
 *   countryCode: string, // e.g. '92'
 *   localNumber: string, // e.g. '3449332512'
 * }
 * or null if invalid
 */
function parsePhoneNumber(phone) {
    if (!phone) return null;

    // parsePhoneNumberFromString automatically handles '+' and known country codes:
    const parsed = parsePhoneNumberFromString(phone);

    // If parsing fails or the number is invalid, return null
    if (!parsed || !parsed.isValid()) {
        return null;
    }

    // Country calling code is usually something like '92' for Pakistan, '1' for US, etc.
    const countryCode = parsed.countryCallingCode;
    // This is the local / national number (without the country code)
    const localNumber = parsed.nationalNumber;

    return { countryCode, localNumber };
}

module.exports = { parsePhoneNumber };
