const bcrypt = require('bcryptjs');

function generateHash(password) {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}

// Usage
const password = 'admin123'; // Change this to your desired password
const hashedPassword = generateHash(password);

console.log('Password:', password);
console.log('Hash:', hashedPassword);