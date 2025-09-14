#!/bin/bash
# ssl-setup.sh - Run this once to obtain SSL certificates

set -euo pipefail

DOMAIN="megaecommerce.ddns.net"
EMAIL="oakarkyaw@gmail.com"

echo "🔹 Setting up SSL certificates for $DOMAIN"

# Create directories
mkdir -p certbot/conf certbot/www

# Check if certificate already exists
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate already exists for $DOMAIN"
    exit 0
fi

#echo "🔹 Starting containers without SSL..."
docker-compose up -d auth user nginx-proxy

Wait for nginx to be ready
echo "🔹 Waiting for nginx to be ready..."
sleep 10

# Test if the domain is accessible
echo "🔹 Testing domain accessibility..."
if ! curl -f http://$DOMAIN/.well-known/acme-challenge/test 2>/dev/null; then
    echo "⚠️  Domain might not be accessible. Continuing anyway..."
fi

# Obtain certificate
echo "🔹 Obtaining SSL certificate..."
docker-compose run --rm certbot certonly \
    --webroot \
    -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    --agree-tos \
    --no-eff-email \
    --verbose

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Restart nginx to load the new certificate
    echo "🔹 Restarting nginx to load SSL certificate..."
    docker-compose restart nginx
    
    echo "✅ SSL setup complete!"
    echo "🔗 Your site should now be available at: https://$DOMAIN"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "📋 Troubleshooting steps:"
    echo "   1. Ensure $DOMAIN points to this server's IP"
    echo "   2. Check if port 80 is accessible from the internet"
    echo "   3. Verify nginx is running and serving /.well-known/acme-challenge/"
    exit 1
fi