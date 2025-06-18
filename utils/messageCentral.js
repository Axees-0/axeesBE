// utils/messageCentral.js
const axios = require('axios');
const { parsePhoneNumber } = require('./phoneParserUtils');
const NodeCache = require('node-cache');

// Cache instance with a TTL of 15 minutes (15 * 60 seconds)
const tokenCache = new NodeCache({ stdTTL: 15 * 60 });

async function getMessageCentralToken() {
    // Check if token exists in cache
    const cachedToken = tokenCache.get("messageCentralToken");
    if (cachedToken) {
        return cachedToken;
    }

    // Check if credentials are configured
    const { MESSAGECENTRAL_CUSTOMER_ID, MESSAGECENTRAL_EMAIL, MESSAGECENTRAL_KEY, MESSAGECENTRAL_SCOPE } = process.env;
    
    // If any credential is missing or has placeholder value, return mock token
    if (!MESSAGECENTRAL_CUSTOMER_ID || !MESSAGECENTRAL_EMAIL || !MESSAGECENTRAL_KEY || !MESSAGECENTRAL_SCOPE ||
        MESSAGECENTRAL_CUSTOMER_ID.includes('your_') || MESSAGECENTRAL_EMAIL.includes('your_') || 
        MESSAGECENTRAL_KEY.includes('your_') || MESSAGECENTRAL_SCOPE.includes('your_')) {
        console.log('🚫 MessageCentral credentials not configured - using mock mode');
        const mockToken = 'mock-token-development-mode';
        tokenCache.set("messageCentralToken", mockToken);
        return mockToken;
    }

    // Otherwise, fetch a new token from MessageCentral
    const baseUrl = 'https://cpaas.messagecentral.com';
    const url = `${baseUrl}/auth/v1/authentication/token?customerId=${MESSAGECENTRAL_CUSTOMER_ID}&key=${MESSAGECENTRAL_KEY}&scope=${MESSAGECENTRAL_SCOPE}&country=1&email=${MESSAGECENTRAL_EMAIL}`;

    const response = await axios.get(url, {
        headers: { accept: '*/*' },
    });

    if (response.status !== 200 || !response.data?.token) {
        throw new Error('Could not obtain MessageCentral token');
    }

    const token = response.data.token;
    // Cache the token with the specified TTL
    tokenCache.set("messageCentralToken", token);
    return token;
}

async function sendOtp(fullPhone) {
    // 1) Parse the phone with libphonenumber-js via your utility
    const parsed = parsePhoneNumber(fullPhone);
    if (!parsed) {
        throw new Error(`Invalid phone number: ${fullPhone}`);
    }

    const { countryCode, localNumber } = parsed;
    console.log('Country Code:', countryCode);
    console.log('Local Number:', localNumber);

    // 2) Get your authToken from MessageCentral using our cached method
    const authToken = await getMessageCentralToken();

    // If using mock token, return mock verification ID
    if (authToken === 'mock-token-development-mode') {
        console.log('📱 Mock SMS OTP sent to:', fullPhone);
        const mockVerificationId = `mock-verification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return mockVerificationId;
    }

    // 3) Build the request URL:
    // e.g. https://cpaas.messagecentral.com/verification/v3/send?countryCode=92&flowType=SMS&mobileNumber=3449332512
    const baseUrl = 'https://cpaas.messagecentral.com';
    const url = `${baseUrl}/verification/v3/send?countryCode=${countryCode}&flowType=SMS&mobileNumber=${localNumber}`;

    // 4) Fire the request
    const headers = { authToken };
    const response = await axios.post(url, {}, { headers });
    console.log(headers)
    // 5) Return the verificationId from the response
    const { data } = response;
    if (data?.data?.verificationId) {
        return data.data.verificationId;
    } else {
        throw new Error(`MessageCentral sendOtp failed: ${JSON.stringify(data)}`);
    }
}

async function verifyOtp(verificationId, code) {
    // Get the authToken from cache (or fetch a new one)
    const authToken = await getMessageCentralToken();

    // If using mock token, simulate OTP verification
    if (authToken === 'mock-token-development-mode') {
        console.log('🔑 Mock OTP verification for:', verificationId, 'with code:', code);
        // Accept any 6-digit code for mock mode, or specific test codes
        if (code === '123456' || code === '000000' || /^\d{6}$/.test(code)) {
            console.log('✅ Mock OTP verification successful');
            return true;
        } else {
            throw new Error('Mock OTP verification failed - use 6-digit code like 123456');
        }
    }

    const baseUrl = 'https://cpaas.messagecentral.com';

    // Build URL for OTP verification
    const url = `${baseUrl}/verification/v3/validateOtp?verificationId=${verificationId}&code=${code}`;

    const headers = { authToken };
    console.log(headers)
    const response = await axios.get(url, { headers });

    // Check if OTP verification succeeded
    if (response.data?.responseCode === 200 && response.data?.data?.verificationStatus === 'VERIFICATION_COMPLETED') {
        return true;
    }

    // Otherwise, throw an error with an appropriate message
    throw new Error(response.data?.data?.errorMessage || 'OTP verification failed');
}

module.exports = {
    sendOtp,
    verifyOtp
};
