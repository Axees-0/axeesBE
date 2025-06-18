export function isMessageAllowed(message: string): boolean {
  // Basic content filtering - placeholder implementation
  const forbiddenWords = ['spam', 'scam', 'fraud'];
  const lowerMessage = message.toLowerCase();
  
  return !forbiddenWords.some(word => lowerMessage.includes(word));
}

export function validateMessage(message: string): { isValid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 1000) {
    return { isValid: false, error: 'Message too long (max 1000 characters)' };
  }
  
  if (!isMessageAllowed(message)) {
    return { isValid: false, error: 'Message contains inappropriate content' };
  }
  
  return { isValid: true };
}