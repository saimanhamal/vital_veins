const express = require('express');
const fs = require('fs');

// Add health check endpoint to server.js
const serverPath = './server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if health endpoint already exists
if (!serverContent.includes('/api/health')) {
  // Find the routes section and add health check
  const routesSection = serverContent.indexOf('// Routes');
  if (routesSection !== -1) {
    const insertPoint = serverContent.indexOf('\n', routesSection);
    const healthCheck = `
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

`;
    
    serverContent = serverContent.slice(0, insertPoint + 1) + healthCheck + serverContent.slice(insertPoint + 1);
    
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Added health check endpoint to server.js');
  }
} else {
  console.log('✅ Health check endpoint already exists');
}

// Also add CORS debugging
const corsDebug = `
// CORS debugging middleware
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.path}\`);
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
  }
  next();
});

`;

if (!serverContent.includes('CORS debugging')) {
  const corsIndex = serverContent.indexOf('app.use(cors({');
  if (corsIndex !== -1) {
    const insertPoint = serverContent.lastIndexOf('\n', corsIndex);
    serverContent = serverContent.slice(0, insertPoint + 1) + corsDebug + serverContent.slice(insertPoint + 1);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Added CORS debugging to server.js');
  }
}
