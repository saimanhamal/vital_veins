const fs = require('fs');
const path = require('path');

// Read the current auth.js file
const authPath = path.join(__dirname, 'routes', 'auth.js');
let authContent = fs.readFileSync(authPath, 'utf8');

// Check if we already have the fix
if (authContent.includes('// TEMPORARY FIX FOR DONOR LOGIN')) {
  console.log('✅ Auth route already has the donor login fix');
  process.exit(0);
}

// Find the password check section and replace it
const oldPasswordCheck = `    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }`;

const newPasswordCheck = `    // Check password
    // TEMPORARY FIX FOR DONOR LOGIN - Use direct bcrypt for all users
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }`;

// Replace the password check
const updatedContent = authContent.replace(oldPasswordCheck, newPasswordCheck);

if (updatedContent === authContent) {
  console.log('❌ Could not find the password check section to replace');
  console.log('The auth route might have been modified already');
  process.exit(1);
}

// Write the updated content back
fs.writeFileSync(authPath, updatedContent);

console.log('✅ Fixed auth route to use direct bcrypt comparison');
console.log('🔄 Please restart the backend server for changes to take effect');
console.log('   cd backend && npm start');

console.log('\n🧪 After restarting, test with:');
console.log('   rahul.sharma@gmail.com / donor123');
console.log('   priya.singh@gmail.com / donor123');
console.log('   amit.kumar@gmail.com / donor123');
console.log('   sneha.patel@gmail.com / donor123');
console.log('   vikash.gupta@gmail.com / donor123');
