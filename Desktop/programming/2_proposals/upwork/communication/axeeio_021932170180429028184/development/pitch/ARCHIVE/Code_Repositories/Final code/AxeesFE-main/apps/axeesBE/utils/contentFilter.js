// src/utils/contentFilter.ts
const BAD_WORDS = [

    
    /* fill with 🔞 words */
  ];
  const CONTACT_PATTERNS = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // phone
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, // email
    /(https?:\/\/)?(www\.)?(instagram|facebook|telegram|whatsapp)\./gi,
  ];
   function isMessageAllowed(text) {
    const lower = text.toLowerCase();
    if (BAD_WORDS.some(w => lower.includes(w))) return false;
    return !CONTACT_PATTERNS.some(r => r.test(text));
  }

  module.exports = { isMessageAllowed };