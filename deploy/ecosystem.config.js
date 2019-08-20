module.exports = {
    apps: [{
      name: 'arbitrage-bot',
      script: './index.js'
    }],
    deploy: {
      production: {
        user: 'ec2-user',
        host: 'ec2-3-9-16-247.eu-west-2.compute.amazonaws.com',
        key: 'id_rsa',
        ref: 'origin/master',
        repo: 'git@github.com/florianpautot/crypto-trading-bot.git',
        path: '/home/ec2-user/arbitrage-bot',
        'post-deploy': 'npm install'
      }
    }
  };