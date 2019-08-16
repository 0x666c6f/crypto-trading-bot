#!/bin/bash
sudo yum update -y
sudo yum install make glibc-devel gcc patch -y
sudo yum install gcc-c++ -y
sudo yum install git -y 
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
. .bashrc
nvm install node
git clone https://github.com/florianpautot/crypto-trading-bot.git bot
cd bot
npm install