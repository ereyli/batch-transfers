// Contract addresses for different networks
export const CONTRACTS = {
  8453: "0x74a2c6466d98253ca932fe6a6ccb811d4d7d5784",  // Base
  10:   "0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9",  // Optimism
  42161:"0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9",  // Arbitrum
  1868: "0x84e4dd821c8f848470fc49def3b14fc870fa97f0",  // Soneium
  130:  "0x84e4dd821c8f848470fc49def3b14fc870fa97f0",  // Unichain
  57073:"0x84e4dd821c8f848470fc49def3b14fc870fa97f0"   // Ink
};

export const CONTRACTS_ERC20 = { ...CONTRACTS };

// RPC Endpoints for different networks
export const RPC_ENDPOINTS = {
  1: "https://eth.llamarpc.com",           // Ethereum Mainnet
  8453: "https://mainnet.base.org",        // Base
  10: "https://mainnet.optimism.io",       // Optimism
  42161: "https://arb1.arbitrum.io/rpc",   // Arbitrum
  1868: "https://rpc.soneium.com",         // Soneium
  130: "https://rpc.unichain.world",       // Unichain
  57073: "https://rpc.inkchain.io"         // Ink
};

// Network names for display
export const NETWORK_NAMES = {
  1: "Ethereum",
  8453: "Base",
  10: "Optimism", 
  42161: "Arbitrum",
  1868: "Soneium",
  130: "Unichain",
  57073: "Ink"
};

// Contract ABIs
export const ABI_TOKEN = [
  "function name() view returns(string)",
  "function symbol() view returns(string)",
  "function decimals() view returns(uint8)",
  "function balanceOf(address) view returns(uint256)",
  "function allowance(address,address) view returns(uint256)"
];

export const ABI_APPROVE = [
  "function approve(address,uint256) external returns(bool)"
];

export const ABI_BATCH_ETH = [
  "function batchSend(address[] calldata recipients, uint256[] calldata amounts) external payable"
];

export const ABI_BATCH_ERC20 = [
  "function batchSendERC20(address token, address[] calldata recipients, uint256[] calldata amounts) external payable"
];

// App configuration
export const APP_CONFIG = {
  fee: "0.001", // ETH fee for transactions
  gasLimit: 500000,
  logoUrl: "https://bafybeigudidkz2nstogywhcb6gbwicvfdfqgkrdhjsnlvll5esa6hzic4e.ipfs.w3s.link/logo.png"
};
