// Format phone number to standard format (remove spaces, dashes)
const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  return phone.replace(/[\s-]/g, "");
};

// Check if phone exists in either format
const findUserByPhone = async (User, phone) => {
  const formattedPhone = formatPhoneNumber(phone);
  const originalPhone = phone;

  // Try both formats
  const user = await User.findOne({
    $or: [{ phone: formattedPhone }, { phone: originalPhone }],
  });

  return user;
};

module.exports = {
  formatPhoneNumber,
  findUserByPhone,
};
