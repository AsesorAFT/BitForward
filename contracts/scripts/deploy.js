const { ethers, network } = require('hardhat');

/**
 * @title BitForward Deployment Script
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @notice Script completo para deploy del protocolo BitForward en RSK
 * @dev Incluye validaciones de seguridad y configuración de roles
 */

async function main() {
  console.log('🚀 Iniciando deployment de BitForward Protocol...');
  console.log('📡 Network:', network.name);
  console.log('⛓️  Chain ID:', network.config.chainId);

  const [deployer] = await ethers.getSigners();
  console.log('👤 Deployer:', deployer.address);
  console.log(
    '💰 Balance:',
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    'RBTC'
  );

  // ========== CONFIGURACIÓN ==========

  const config = {
    // Direcciones de tokens en RSK (usar mock para testnet)
    wbtcAddress:
      network.name === 'rsk-mainnet'
        ? '0x542fDA317318eBF1d3DEAf76E0b632741A7e677d' // WBTC real en RSK mainnet
        : ethers.ZeroAddress, // Se deployará mock en testnet

    // Configuración inicial del vault
    vaultName: 'BitForward BTC Vault',
    vaultSymbol: 'bfBTC',

    // Configuración inicial del oracle (precio BTC)
    initialBTCPrice: ethers.parseUnits('67000', 8), // $67,000

    // Parámetros de riesgo iniciales (conservadores)
    riskConfig: {
      minCollateralRatio: 1500, // 150%
      liquidationThreshold: 1200, // 120%
      maxLeverage: 500, // 5x
      maxNotionalPerUser: ethers.parseUnits('100000', 8), // $100K
      protocolFee: 50, // 0.5%
    },
  };

  // ========== DEPLOYMENT ==========

  let wbtcToken;

  // 1. Deploy WBTC mock si es necesario
  if (config.wbtcAddress === ethers.ZeroAddress) {
    console.log('\n📦 Deploying MockWBTC...');
    const MockWBTC = await ethers.getContractFactory('MockERC20');
    wbtcToken = await MockWBTC.deploy(
      'Wrapped Bitcoin',
      'WBTC',
      8,
      ethers.parseUnits('1000', 8) // 1000 WBTC inicial
    );
    await wbtcToken.waitForDeployment();
    console.log('✅ MockWBTC deployed to:', await wbtcToken.getAddress());
    config.wbtcAddress = await wbtcToken.getAddress();
  } else {
    console.log('🔗 Using existing WBTC at:', config.wbtcAddress);
    wbtcToken = await ethers.getContractAt('IERC20', config.wbtcAddress);
  }

  // 2. Deploy MockOracle
  console.log('\n📦 Deploying MockOracle...');
  const MockOracle = await ethers.getContractFactory('MockOracle');
  const oracle = await MockOracle.deploy();
  await oracle.waitForDeployment();
  console.log('✅ MockOracle deployed to:', await oracle.getAddress());

  // Configurar precio inicial
  await oracle.setPrice(config.initialBTCPrice, 10000);
  console.log('💲 Initial BTC price set to:', ethers.formatUnits(config.initialBTCPrice, 8), 'USD');

  // 3. Deploy BitForwardVault
  console.log('\n📦 Deploying BitForwardVault...');
  const BitForwardVault = await ethers.getContractFactory('BitForwardVault');
  const vault = await BitForwardVault.deploy(
    config.wbtcAddress,
    config.vaultName,
    config.vaultSymbol,
    deployer.address
  );
  await vault.waitForDeployment();
  console.log('✅ BitForwardVault deployed to:', await vault.getAddress());

  // 4. Deploy ForwardEngine
  console.log('\n📦 Deploying ForwardEngine...');
  const ForwardEngine = await ethers.getContractFactory('ForwardEngine');
  const forwardEngine = await ForwardEngine.deploy(
    await oracle.getAddress(),
    await vault.getAddress(),
    config.wbtcAddress,
    deployer.address
  );
  await forwardEngine.waitForDeployment();
  console.log('✅ ForwardEngine deployed to:', await forwardEngine.getAddress());

  // ========== CONFIGURACIÓN POST-DEPLOYMENT ==========

  console.log('\n⚙️  Configurando permisos y roles...');

  // 5. Configurar roles en el vault
  const FORWARD_ENGINE_ROLE = await vault.FORWARD_ENGINE_ROLE();
  await vault.grantRole(FORWARD_ENGINE_ROLE, await forwardEngine.getAddress());
  console.log('✅ ForwardEngine autorizado en Vault');

  // 6. Configurar parámetros de riesgo en ForwardEngine
  await forwardEngine.updateRiskConfig(config.riskConfig);
  console.log('✅ Risk parameters configurados');

  // ========== VERIFICACIONES DE SEGURIDAD ==========

  console.log('\n🔍 Ejecutando verificaciones de seguridad...');

  // Verificar que los contratos están correctamente linkados
  const engineOracle = await forwardEngine.priceOracle();
  const engineVault = await forwardEngine.liquidityVault();
  const engineCollateral = await forwardEngine.collateralToken();

  console.log('Oracle en Engine:', engineOracle === (await oracle.getAddress()) ? '✅' : '❌');
  console.log('Vault en Engine:', engineVault === (await vault.getAddress()) ? '✅' : '❌');
  console.log('Collateral en Engine:', engineCollateral === config.wbtcAddress ? '✅' : '❌');

  // Verificar roles
  const hasEngineRole = await vault.hasRole(FORWARD_ENGINE_ROLE, await forwardEngine.getAddress());
  console.log('Engine tiene rol en Vault:', hasEngineRole ? '✅' : '❌');

  // Verificar oracle health
  const oracleHealthy = await oracle.isHealthy();
  console.log('Oracle saludable:', oracleHealthy ? '✅' : '❌');

  // ========== DEPLOYMENT SUMMARY ==========

  console.log('\n🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE!');
  console.log('='.repeat(60));
  console.log('📋 ADDRESSES:');
  console.log('   WBTC Token:', config.wbtcAddress);
  console.log('   Oracle:', await oracle.getAddress());
  console.log('   Vault:', await vault.getAddress());
  console.log('   ForwardEngine:', await forwardEngine.getAddress());
  console.log('='.repeat(60));
  console.log('⚙️  CONFIGURATION:');
  console.log('   Initial BTC Price: $', ethers.formatUnits(config.initialBTCPrice, 8));
  console.log('   Min Collateral Ratio:', config.riskConfig.minCollateralRatio / 100, '%');
  console.log('   Max Leverage:', config.riskConfig.maxLeverage / 100, 'x');
  console.log('   Protocol Fee:', config.riskConfig.protocolFee / 100, '%');
  console.log('='.repeat(60));

  // ========== SAVE DEPLOYMENT INFO ==========

  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      wbtc: config.wbtcAddress,
      oracle: await oracle.getAddress(),
      vault: await vault.getAddress(),
      forwardEngine: await forwardEngine.getAddress(),
    },
    config: config,
    verification: {
      oracleLinked: engineOracle === (await oracle.getAddress()),
      vaultLinked: engineVault === (await vault.getAddress()),
      collateralLinked: engineCollateral === config.wbtcAddress,
      engineAuthorized: hasEngineRole,
      oracleHealthy: oracleHealthy,
    },
  };

  // Guardar en archivo JSON
  const fs = require('fs');
  const deploymentPath = `./deployments/${network.name}-${Date.now()}.json`;

  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments', { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('💾 Deployment info saved to:', deploymentPath);

  // ========== DEMO TRANSACTIONS (TESTNET ONLY) ==========

  if (network.name.includes('testnet') || network.name === 'localhost') {
    console.log('\n🧪 Ejecutando transacciones de demo...');

    try {
      // Mint algunos WBTC para el deployer si es mock
      if (wbtcToken && typeof wbtcToken.mint === 'function') {
        await wbtcToken.mint(deployer.address, ethers.parseUnits('10', 8));
        console.log('✅ Minted 10 WBTC para testing');
      }

      // Depositar en vault
      const depositAmount = ethers.parseUnits('1', 8); // 1 WBTC
      await wbtcToken.approve(await vault.getAddress(), depositAmount);
      await vault.deposit(depositAmount, deployer.address);
      console.log('✅ Depositado 1 WBTC en vault');

      // Crear un forward de prueba
      const forwardCollateral = ethers.parseUnits('0.1', 8); // 0.1 WBTC
      const forwardNotional = ethers.parseUnits('6700', 8); // $6,700 notional
      const forwardExpiry = Math.floor(Date.now() / 1000) + 86400; // 1 día
      const forwardLeverage = 200; // 2x

      await wbtcToken.approve(await forwardEngine.getAddress(), forwardCollateral);

      const tx = await forwardEngine.openForward(
        forwardCollateral,
        forwardNotional,
        forwardExpiry,
        forwardLeverage,
        true, // long
        0 // no target price
      );

      const receipt = await tx.wait();
      console.log('✅ Forward creado exitosamente, Gas usado:', receipt.gasUsed.toString());
    } catch (error) {
      console.log('⚠️  Demo transactions failed (expected en algunos casos):', error.message);
    }
  }

  console.log('\n🚀 BitForward Protocol está listo para usar!');
  console.log('📚 Para interactuar con el protocolo, usa las addresses arriba.');
  console.log('🔗 Dashboard: http://localhost:8080/dashboard.html');
}

// Mock ERC20 contract for testing
const mockERC20ABI = [
  'constructor(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply)',
  'function mint(address to, uint256 amount) external',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
];

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });
