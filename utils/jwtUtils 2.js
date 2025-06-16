const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const generateToken = (userOrId) => {
  // Handle both user object and user ID
  let payload;
  if (typeof userOrId === 'object' && userOrId._id) {
    // If passed a user object, extract needed fields
    payload = {
      id: userOrId._id.toString(),
      phone: userOrId.phone,
      userType: userOrId.userType
    };
  } else {
    // If passed just an ID (for backward compatibility)
    payload = { user: userOrId.toString() };
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

module.exports = { generateToken };
