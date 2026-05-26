require('dotenv').config();

console.log('Environment variables test:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'Not found');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');