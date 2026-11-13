const path = require('path');

const projectRoot = __dirname;
const frontendBuild = path.join(projectRoot, 'frontend', 'build');

module.exports = {
  apps: [
    {
      name: 'cdf-backend',
      cwd: path.join(projectRoot, 'backend'),
      script: '/usr/bin/npm',
      args: 'start',
      interpreter: '/usr/bin/node',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'cdf-frontend',
      cwd: frontendBuild,
      script: '/usr/local/lib/node_modules/pm2/lib/API/Serve.js',
      interpreter: '/usr/bin/node',
      env: {
        PM2_SERVE_PATH: frontendBuild,
        PM2_SERVE_PORT: '3000',
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_FTP: 'false'
      }
    }
  ]
};
