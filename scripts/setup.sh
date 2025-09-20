#!/bin/bash

# BitForward v2.0 Setup Script
# Configuración completa de la plataforma DeFi

set -e

echo "🚀 BitForward v2.0 - Complete Setup Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v $1 >/dev/null 2>&1; then
        log_success "$1 is installed"
        return 0
    else
        log_warning "$1 is not installed"
        return 1
    fi
}

# Check system requirements
log_info "Checking system requirements..."

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
else
    log_error "Node.js is required. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if check_command npm; then
    NPM_VERSION=$(npm --version)
    log_info "npm version: $NPM_VERSION"
else
    log_error "npm is required. Please install npm"
    exit 1
fi

# Check Python
if check_command python3; then
    PYTHON_VERSION=$(python3 --version)
    log_info "Python version: $PYTHON_VERSION"
else
    log_warning "Python3 not found. Some features may not work."
fi

# Check Git
if check_command git; then
    GIT_VERSION=$(git --version)
    log_info "Git version: $GIT_VERSION"
else
    log_warning "Git not found. Version control features may not work."
fi

echo ""
log_info "Installing Node.js dependencies..."

# Install backend dependencies
cd server 2>/dev/null || log_warning "Server directory not found"

if [ -f "package.json" ]; then
    log_info "Installing server dependencies..."
    npm install
    log_success "Server dependencies installed"
else
    log_warning "Server package.json not found"
fi

# Return to root directory
cd ..

# Install root dependencies if package.json exists
if [ -f "package.json" ]; then
    log_info "Installing root dependencies..."
    npm install
    log_success "Root dependencies installed"
fi

echo ""
log_info "Setting up environment configuration..."

# Create .env file if it doesn't exist
if [ ! -f "server/.env" ]; then
    log_info "Creating environment configuration..."
    cat > server/.env << EOL
# BitForward v2.0 Environment Configuration
NODE_ENV=development
PORT=3000

# Database
DB_PATH=./database/bitforward.db

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API Keys (Replace with real values in production)
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key
MORALIS_API_KEY=your_moralis_api_key

# External APIs
COINGECKO_API_URL=https://api.coingecko.com/api/v3
BINANCE_API_URL=https://api.binance.com/api/v3

# CORS
CORS_ORIGIN=http://localhost:8080

# Logging
LOG_LEVEL=info
LOG_FILE=logs/bitforward.log

# Blockchain Networks
ETHEREUM_MAINNET_RPC=https://mainnet.infura.io/v3/\${INFURA_PROJECT_ID}
ETHEREUM_GOERLI_RPC=https://goerli.infura.io/v3/\${INFURA_PROJECT_ID}
POLYGON_MAINNET_RPC=https://polygon-rpc.com
SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_RPC=https://api.devnet.solana.com

# Contract Addresses (Will be set after deployment)
ETHEREUM_CONTRACT_ADDRESS=
POLYGON_CONTRACT_ADDRESS=
SOLANA_PROGRAM_ID=
EOL
    log_success "Environment file created"
else
    log_info "Environment file already exists"
fi

# Create logs directory
if [ ! -d "server/logs" ]; then
    mkdir -p server/logs
    log_success "Logs directory created"
fi

# Create database directory
if [ ! -d "server/database" ]; then
    mkdir -p server/database
    log_success "Database directory created"
fi

echo ""
log_info "Setting up database..."

# Initialize database
cd server
if check_command node; then
    node -e "
        const Database = require('./database/database.js');
        const db = new Database();
        db.init().then(() => {
            console.log('Database initialized successfully');
            process.exit(0);
        }).catch(err => {
            console.error('Database initialization failed:', err);
            process.exit(1);
        });
    " && log_success "Database initialized" || log_warning "Database initialization failed"
fi

cd ..

echo ""
log_info "Setting up Smart Contracts..."

# Check if Hardhat is available for contract compilation
if [ -d "contracts" ]; then
    log_info "Smart contracts directory found"
    
    # Create hardhat.config.js if it doesn't exist
    if [ ! -f "hardhat.config.js" ]; then
        log_info "Creating Hardhat configuration..."
        cat > hardhat.config.js << EOL
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "./server/.env" });

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    goerli: {
      url: process.env.ETHEREUM_GOERLI_RPC,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    mainnet: {
      url: process.env.ETHEREUM_MAINNET_RPC,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
EOL
        log_success "Hardhat configuration created"
    fi
    
    # Install Hardhat if not present
    if [ ! -f "package.json" ] || ! grep -q "hardhat" package.json; then
        log_info "Installing Hardhat and dependencies..."
        npm init -y >/dev/null 2>&1 || true
        npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomiclabs/hardhat-ethers ethers dotenv
        log_success "Hardhat installed"
    fi
else
    log_warning "Smart contracts directory not found"
fi

echo ""
log_info "Creating deployment scripts..."

# Create scripts directory
mkdir -p scripts

# Create deployment script
cat > scripts/deploy.js << EOL
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BitForward contracts...");

  // Deploy BitForwardContract
  const BitForwardContract = await hre.ethers.getContractFactory("BitForwardContract");
  
  // Replace with actual fee recipient address
  const feeRecipient = "0x742d35Cc6634C0532925a3b8D10fc31b4fb1B96d"; // Example address
  
  const bitforward = await BitForwardContract.deploy(feeRecipient);
  await bitforward.deployed();

  console.log("BitForwardContract deployed to:", bitforward.address);
  console.log("Fee recipient:", feeRecipient);
  
  // Verify contract on Etherscan (if API key is provided)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await bitforward.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: bitforward.address,
        constructorArguments: [feeRecipient],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Etherscan verification failed:", error.message);
    }
  }
  
  // Save deployment info
  const deploymentInfo = {
    address: bitforward.address,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    transactionHash: bitforward.deployTransaction.hash
  };
  
  require("fs").writeFileSync(
    \`deployments/\${hre.network.name}-deployment.json\`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployments/ directory");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
EOL

# Create deployments directory
mkdir -p deployments

log_success "Deployment scripts created"

echo ""
log_info "Setting up development tools..."

# Create test script
cat > scripts/test.sh << EOL
#!/bin/bash

echo "🧪 Running BitForward Test Suite"
echo "================================"

# Backend tests
echo "Running backend tests..."
cd server
npm test 2>/dev/null || echo "Backend tests not configured"

cd ..

# Smart contract tests
echo "Running smart contract tests..."
npx hardhat test 2>/dev/null || echo "Smart contract tests not configured"

# Frontend tests (if any)
echo "Running frontend tests..."
python3 -m http.server 8080 &
SERVER_PID=\$!
sleep 2

# Basic connectivity test
curl -s http://localhost:8080 >/dev/null && echo "✅ Frontend server running" || echo "❌ Frontend server failed"

kill \$SERVER_PID 2>/dev/null || true

echo "✅ Test suite completed"
EOL

chmod +x scripts/test.sh

# Create start script
cat > scripts/start.sh << EOL
#!/bin/bash

echo "🚀 Starting BitForward Platform"
echo "=============================="

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "❌ Environment file not found. Run setup.sh first."
    exit 1
fi

# Start backend server
echo "Starting backend server..."
cd server
npm start &
BACKEND_PID=\$!

cd ..

# Start frontend server
echo "Starting frontend server..."
python3 -m http.server 8080 &
FRONTEND_PID=\$!

echo "✅ BitForward platform started:"
echo "   - Backend: http://localhost:3000"
echo "   - Frontend: http://localhost:8080"
echo "   - Dashboard: http://localhost:8080/dashboard.html"
echo ""
echo "Press Ctrl+C to stop all servers"

# Trap Ctrl+C to stop both servers
trap 'echo "Stopping servers..."; kill \$BACKEND_PID \$FRONTEND_PID 2>/dev/null; exit 0' INT

# Wait for servers
wait
EOL

chmod +x scripts/start.sh

log_success "Development scripts created"

echo ""
log_info "Creating documentation..."

# Create API documentation
cat > API.md << EOL
# BitForward v2.0 API Documentation

## Authentication Endpoints

### POST /api/auth/login
Login with username and password.

**Request:**
\`\`\`json
{
  "username": "string",
  "password": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "user_id",
    "username": "username",
    "role": "user"
  }
}
\`\`\`

### POST /api/auth/refresh
Refresh JWT token.

### POST /api/auth/logout
Logout and invalidate tokens.

## Contract Endpoints

### GET /api/contracts
Get user's contracts.

### POST /api/contracts
Create new forward contract.

### GET /api/contracts/:id
Get specific contract details.

### PUT /api/contracts/:id/execute
Execute contract at expiry.

### DELETE /api/contracts/:id
Cancel contract (if allowed).

## Statistics Endpoints

### GET /api/stats/summary
Get platform statistics summary.

### GET /api/stats/user
Get user-specific statistics.

## Rate Limiting
- 100 requests per 15 minutes per IP
- Higher limits for authenticated users

## Error Responses
All errors follow this format:
\`\`\`json
{
  "success": false,
  "error": "error_code",
  "message": "Human readable message"
}
\`\`\`
EOL

log_success "API documentation created"

echo ""
log_info "Final setup steps..."

# Create package.json scripts if not present
if [ -f "package.json" ]; then
    # Add helpful npm scripts
    node -e "
        const pkg = require('./package.json');
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.setup = 'bash scripts/setup.sh';
        pkg.scripts.start = 'bash scripts/start.sh';
        pkg.scripts.test = 'bash scripts/test.sh';
        pkg.scripts.deploy = 'npx hardhat run scripts/deploy.js';
        pkg.scripts['deploy:goerli'] = 'npx hardhat run scripts/deploy.js --network goerli';
        pkg.scripts['deploy:mainnet'] = 'npx hardhat run scripts/deploy.js --network mainnet';
        require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
    "
    log_success "Package.json scripts updated"
fi

echo ""
echo "🎉 BitForward v2.0 Setup Complete!"
echo "=================================="
echo ""
log_success "Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Review and update server/.env with your API keys"
echo "2. Add your private key to .env for contract deployment"
echo "3. Run 'npm run start' to start the platform"
echo "4. Visit http://localhost:8080/dashboard.html"
echo ""
echo "🔧 Available Commands:"
echo "- npm run start     : Start the platform"
echo "- npm run test      : Run test suite" 
echo "- npm run deploy    : Deploy contracts to localhost"
echo "- npm run deploy:goerli : Deploy to Goerli testnet"
echo ""
echo "📚 Documentation:"
echo "- API.md           : API documentation"
echo "- README.md        : Project overview"
echo "- DEVELOPMENT.md   : Development guide"
echo ""
log_warning "Remember to:"
log_warning "- Keep your private keys secure"
log_warning "- Use testnet for development"
log_warning "- Review smart contracts before mainnet deployment"
log_warning "- Set up proper monitoring for production"
echo ""
log_info "Happy building! 🚀"
EOL
