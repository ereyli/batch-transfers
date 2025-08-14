import { CONTRACTS, CONTRACTS_ERC20, ABI_TOKEN, ABI_APPROVE, ABI_BATCH_ETH, ABI_BATCH_ERC20, APP_CONFIG } from './config.js';

export class BlockchainManager {
  constructor(walletManager, uiManager) {
    this.walletManager = walletManager;
    this.uiManager = uiManager;
  }

  // Fetch token information
  async fetchTokenInfo() {
    const tokenAddress = this.uiManager.getTokenAddress();
    if (!ethers.utils.isAddress(tokenAddress)) return;
    
    const signer = this.walletManager.getSigner();
    if (!signer) {
      this.uiManager.updateStatus('Please connect wallet first', false, true);
      return;
    }

    try {
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const spender = CONTRACTS_ERC20[network.chainId];
      const token = new ethers.Contract(tokenAddress, ABI_TOKEN, signer);
      const user = await this.walletManager.getAddress();
      
      const [name, symbol, decimals, balance, allowance] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.balanceOf(user),
        token.allowance(user, spender)
      ]);
      
      const tokenInfo = `
        <strong>${name} (${symbol})</strong><br>
        Balance: ${ethers.utils.formatUnits(balance, decimals)} ${symbol}
      `;
      
      this.uiManager.updateTokenInfo(tokenInfo);
      this.uiManager.toggleApproveButton(allowance.isZero());
      this.uiManager.toggleSendButton(!allowance.isZero());
      
    } catch (error) {
      const errorInfo = `<strong>Error:</strong> Failed to fetch token info: ${error.message}`;
      this.uiManager.updateTokenInfo(errorInfo);
    }
  }

  // Approve token
  async approveToken() {
    const tokenAddress = this.uiManager.getTokenAddress();
    const signer = this.walletManager.getSigner();
    
    if (!signer) {
      this.uiManager.updateStatus('Please connect wallet first', false, true);
      return;
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ABI_TOKEN, signer);
      const approveContract = new ethers.Contract(tokenAddress, ABI_APPROVE, signer);
      
      const balance = await tokenContract.balanceOf(await this.walletManager.getAddress());
      if (balance.isZero()) {
        this.uiManager.updateStatus('No tokens to approve', false, true);
        return;
      }
      
      this.uiManager.updateStatus('Approving tokens...', false, false);
      
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const spender = CONTRACTS_ERC20[network.chainId];
      
      const tx = await approveContract.approve(spender, balance);
      this.uiManager.updateStatus('Approval transaction sent: ' + tx.hash, false, false);
      
      await tx.wait();
      this.uiManager.updateStatus('✅ Token approval successful!', true, false);
      
      this.uiManager.toggleApproveButton(false);
      this.uiManager.toggleSendButton(true);
      
    } catch (error) {
      this.uiManager.updateStatus('Approval error: ' + error.message, false, true);
    }
  }

  // Send batch transfer
  async sendBatch() {
    this.uiManager.updateStatus('🚀 Initiating batch transfer...', false, false);
    
    const signer = this.walletManager.getSigner();
    if (!signer) {
      this.uiManager.updateStatus('Please connect wallet first', false, true);
      return;
    }

    try {
      const transferType = this.uiManager.getTransferType();
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      
      const { recipients, amounts } = this.uiManager.getRecipientData();
      
      // Validate and parse amounts
      const parsedAmounts = [];
      for (let i = 0; i < amounts.length; i++) {
        let parsedAmount;
        try {
          parsedAmount = transferType === 'eth' 
            ? ethers.utils.parseEther(amounts[i])
            : ethers.utils.parseUnits(amounts[i], 18);
        } catch {
          throw new Error(`Invalid amount in row ${i + 1}`);
        }
        parsedAmounts.push(parsedAmount);
      }
      
      const fee = ethers.utils.parseEther(APP_CONFIG.fee);
      let contractAddress, abi, args, overrides = { gasLimit: APP_CONFIG.gasLimit };
      
      if (transferType === 'eth') {
        contractAddress = CONTRACTS[chainId];
        abi = ABI_BATCH_ETH;
        const total = parsedAmounts.reduce((sum, amount) => sum.add(amount), ethers.BigNumber.from(0));
        overrides.value = total.add(fee);
        args = [recipients, parsedAmounts];
      } else {
        contractAddress = CONTRACTS_ERC20[chainId];
        abi = ABI_BATCH_ERC20;
        const tokenAddress = this.uiManager.getTokenAddress();
        overrides.value = fee;
        args = [tokenAddress, recipients, parsedAmounts];
      }
      
      if (!contractAddress) {
        this.uiManager.updateStatus('Unsupported network', false, true);
        return;
      }
      
      this.uiManager.updateStatus('📝 Creating transaction...', false, false);
      
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const methodName = transferType === 'eth' ? 'batchSend' : 'batchSendERC20';
      
      const tx = await contract[methodName](...args, overrides);
      this.uiManager.updateStatus('⏳ Transaction sent: ' + tx.hash, false, false);
      
      await tx.wait();
      this.uiManager.updateStatus('✅ Batch transfer completed successfully!', true, false);
      
      // Share to Farcaster on success
      const farcasterManager = this.walletManager.getFarcasterManager();
      if (farcasterManager.getIsFarcasterMode()) {
        setTimeout(() => farcasterManager.shareToFarcaster(), 1000);
      }
      
    } catch (error) {
      this.uiManager.updateStatus('❌ Transaction failed: ' + error.message, false, true);
    }
  }

  // Get network information
  async getNetworkInfo() {
    const signer = this.walletManager.getSigner();
    if (!signer) return null;
    
    try {
      const provider = signer.provider || new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      return {
        chainId: network.chainId,
        name: network.name
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  // Check if network is supported
  isNetworkSupported(chainId) {
    return CONTRACTS.hasOwnProperty(chainId);
  }

  // Get contract address for current network
  async getContractAddress(transferType = 'eth') {
    const networkInfo = await this.getNetworkInfo();
    if (!networkInfo) return null;
    
    return transferType === 'eth' 
      ? CONTRACTS[networkInfo.chainId]
      : CONTRACTS_ERC20[networkInfo.chainId];
  }
}
