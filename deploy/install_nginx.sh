#!/bin/bash
# Install and configure Nginx for HK Hot Topics

set -e

echo "Installing Nginx..."
sudo apt update
sudo apt install -y nginx

echo "Creating web directory..."
sudo mkdir -p /var/www/hk-tools
sudo chown -R $USER:$USER /var/www/hk-tools

echo "Copying Nginx config..."
sudo cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/hk-tools

echo "Enabling site..."
sudo ln -sf /etc/nginx/sites-available/hk-tools /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "Testing Nginx config..."
sudo nginx -t

echo "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "Done! Nginx is configured for HK Hot Topics."
echo "Access at: http://your-server-ip/"
