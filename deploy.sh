#!/bin/bash

# Deployment Script for Bot + Dashboard 24/7
# Usage: ./deploy.sh [bot|server|client|all]

set -e

echo "🚀 Starting Deployment..."

# Function to deploy Discord Bot
deploy_bot() {
    echo "📱 Deploying Discord Bot..."
    
    # Install dependencies
    npm install --production
    
    # Deploy to Railway
    railway login
    railway up
    
    echo "✅ Bot deployed successfully!"
}

# Function to deploy Dashboard Server
deploy_server() {
    echo "🖥️ Deploying Dashboard Server..."
    
    # Install dependencies
    npm install --production
    
    # Deploy to Railway/Render
    railway up
    
    echo "✅ Server deployed successfully!"
}

# Function to deploy Client
deploy_client() {
    echo "🌐 Deploying Frontend Client..."
    
    cd client
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    # Deploy to Vercel
    vercel --prod
    
    cd ..
    
    echo "✅ Client deployed successfully!"
}

# Function to deploy everything
deploy_all() {
    echo "🔄 Deploying all components..."
    deploy_bot
    deploy_server
    deploy_client
    echo "🎉 Full deployment completed!"
}

# Check deployment type
case "$1" in
    "bot")
        deploy_bot
        ;;
    "server")
        deploy_server
        ;;
    "client")
        deploy_client
        ;;
    "all")
        deploy_all
        ;;
    *)
        echo "Usage: $0 [bot|server|client|all]"
        exit 1
        ;;
esac
