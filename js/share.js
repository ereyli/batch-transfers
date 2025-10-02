// Share functionality for Sendwise Mini App

class ShareManager {
  constructor() {
    this.currentAchievement = null;
  }

  // X (Twitter) Share Function
  shareToX() {
    console.log('Share to X button clicked');
    
    try {
      const appUrl = 'https://farcaster.xyz/miniapps/hkVHvP2VMNsW/sendwise';
      const hashtags = 'Sendwise,BatchTransfer,DeFi,Ethereum,Crypto,Base';
      
      const postText = `🚀 Just discovered Sendwise - the smartest way to send crypto to multiple addresses! 

💰 Batch transfers save gas & time
🔗 Multi-chain support (Base, Optimism, Arbitrum & more)
⚡️ Simple, secure, efficient

Try it out: ${appUrl}

#${hashtags.split(',').join(' #')}`;
      
      const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;
      window.open(xUrl, '_blank', 'width=550,height=420,scrollbars=yes,resizable=yes');
      
      // Track share event
      this.trackShare('x');
      
    } catch (error) {
      console.error('Error sharing to X:', error);
      this.fallbackShare('https://farcaster.xyz/miniapps/hkVHvP2VMNsW/sendwise');
    }
  }

  // Farcaster Share Function
  shareToFarcaster() {
    console.log('Share to Farcaster button clicked');
    
    try {
      const appUrl = 'https://farcaster.xyz/miniapps/hkVHvP2VMNsW/sendwise';
      
      const castText = `🚀 Sendwise makes batch crypto transfers a breeze!

💰 Send to multiple addresses in one transaction
⚡️ Save gas fees and time
🔗 Multi-chain: Base, Optimism, Arbitrum & more

Try it: ${appUrl}

#BatchTransfer #DeFi #Crypto #Base`;

      if (window.isFarcasterMiniApp && window.farcasterSDK?.actions) {
        console.log('Using Farcaster SDK for native sharing');
        window.farcasterSDK.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`);
      } else {
        console.log('Using Warpcast web compose');
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
        window.open(warpcastUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
      }
      
      // Track share event
      this.trackShare('farcaster');
      
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      this.fallbackShare('https://farcaster.xyz/miniapps/hkVHvP2VMNsW/sendwise');
    }
  }

  // Achievement Modal Functions
  showAchievementModal(achievement) {
    const modal = document.getElementById('achievementModal');
    const icon = document.getElementById('achievementIcon');
    const title = document.getElementById('achievementTitle');
    const description = document.getElementById('achievementDescription');
    
    if (!modal || !icon || !title || !description) {
      console.error('Achievement modal elements not found');
      return;
    }
    
    icon.textContent = achievement.icon || '🎉';
    title.textContent = achievement.title || 'Achievement!';
    description.textContent = achievement.description || '';
    
    modal.style.display = 'flex';
    this.currentAchievement = achievement;
    
    console.log('🎉 Achievement modal shown:', achievement);
  }

  closeAchievementModal() {
    const modal = document.getElementById('achievementModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentAchievement = null;
  }

  shareCurrentAchievement() {
    if (this.currentAchievement) {
      try {
        const content = this.generateShareableContent(this.currentAchievement.type, this.currentAchievement.data);
        this.shareOnFarcaster(content);
        
        setTimeout(() => {
          this.closeAchievementModal();
        }, 500);
      } catch (error) {
        console.error('Error sharing achievement:', error);
        this.closeAchievementModal();
      }
    }
  }

  // Generate shareable content based on achievement type
  generateShareableContent(type, data = {}) {
    const baseUrl = window.location.origin;
    
    const shareTemplates = {
      transfer: {
        text: `Just completed a batch transfer on Sendwise! 💸\n\nSent to ${data.recipients || 'multiple'} addresses\nGas saved: ${data.gasSaved || '80%'}\nNetwork: ${data.network || 'Base'}\n\nTry Sendwise for gas-efficient batch transfers!`,
        url: `${baseUrl}?ref=transfer&recipients=${data.recipients || 1}`,
        image: "💸"
      },
      gasOptimization: {
        text: `Sendwise saved me ${data.gasSaved || '80%'} on gas fees! ⛽💰\n\nBatch transfer: ${data.recipients || 'Multiple'} recipients\nNetwork: ${data.network || 'Base'}\nOriginal cost: ${data.originalCost || 'High'}\nActual cost: ${data.actualCost || 'Low'}\n\nSmart contracts are amazing!`,
        url: `${baseUrl}?ref=gas&saved=${data.gasSaved}`,
        image: "⛽"
      },
      multichain: {
        text: `Using Sendwise across multiple chains! 🌐⛓️\n\n✅ Base, Optimism, Arbitrum\n💸 Batch transfers everywhere\n⛽ Gas optimization on all chains\n🚀 One interface, all networks\n\nMulti-chain DeFi made easy!`,
        url: `${baseUrl}?ref=multichain`,
        image: "🌐"
      },
      invite: {
        text: `Just discovered Sendwise - the smartest way to send crypto!\n\nSend to multiple wallets in one transaction and save 80% on gas fees.\n\nTry it: https://www.sendwise.xyz`,
        url: `https://www.sendwise.xyz`,
        image: "🚀"
      }
    };
    
    return shareTemplates[type] || shareTemplates.invite;
  }

  shareOnFarcaster(content) {
    try {
      if (window.farcasterSDK?.actions?.openUrl) {
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(content.text)}&embeds[]=${encodeURIComponent(content.url)}`;
        window.farcasterSDK.actions.openUrl(shareUrl);
        console.log('🚀 Shared via Farcaster SDK');
      } else {
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(content.text)}&embeds[]=${encodeURIComponent(content.url)}`;
        window.open(shareUrl, '_blank');
        console.log('🚀 Shared via direct URL');
      }
    } catch (error) {
      console.error('❌ Share error:', error);
      alert('Failed to open share dialog');
    }
  }

  // Predefined achievement functions
  shareAppWithFriends() {
    const achievement = {
      icon: '🚀',
      title: 'Invite Friends to Sendwise!',
      description: 'Share the smartest way to send crypto with your friends. Multi-chain batch transfers with 80% gas savings!',
      type: 'invite',
      data: {}
    };
    
    this.showAchievementModal(achievement);
  }

  showMultiChainAchievement() {
    const achievement = {
      icon: '🌐',
      title: 'Multi-Chain DeFi Power!',
      description: 'Sendwise supports Base, Optimism, and Arbitrum. One interface for all your batch transfer needs across chains!',
      type: 'multichain',
      data: {}
    };
    
    this.showAchievementModal(achievement);
  }

  showGasOptimizationAchievement(gasSaved, network) {
    const achievement = {
      icon: '⛽',
      title: 'Gas Optimization Master!',
      description: `You saved ${gasSaved} on gas fees using Sendwise smart contracts on ${network}. Efficiency at its finest!`,
      type: 'gasOptimization',
      data: {
        gasSaved: gasSaved,
        network: network
      }
    };
    
    this.showAchievementModal(achievement);
  }

  // Helper functions
  trackShare(method) {
    if (window.gtag) {
      window.gtag('event', 'share', {
        method: method,
        content_type: 'application',
        content_id: 'sendwise_app'
      });
    }
  }

  fallbackShare(url) {
    try {
      navigator.clipboard.writeText(url).then(() => {
        alert('App URL copied to clipboard! Share it manually.');
      }).catch(() => {
        alert('Please share this URL: ' + url);
      });
    } catch (error) {
      alert('Please share this URL: ' + url);
    }
  }
}

// Initialize and expose globally
const shareManager = new ShareManager();

// Global functions for HTML onclick handlers
window.shareToX = () => shareManager.shareToX();
window.shareToFarcaster = () => shareManager.shareToFarcaster();
window.showAchievementModal = (achievement) => shareManager.showAchievementModal(achievement);
window.closeAchievementModal = () => shareManager.closeAchievementModal();
window.shareCurrentAchievement = () => shareManager.shareCurrentAchievement();
window.shareAppWithFriends = () => shareManager.shareAppWithFriends();
window.showMultiChainAchievement = () => shareManager.showMultiChainAchievement();
window.showGasOptimizationAchievement = (gasSaved, network) => shareManager.showGasOptimizationAchievement(gasSaved, network);

window.ShareManager = ShareManager;
window.shareManager = shareManager;
