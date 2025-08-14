export class UIManager {
  constructor() {
    this.initializeEventListeners();
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Transfer type change
    const transferTypeSelect = document.getElementById('transferType');
    if (transferTypeSelect) {
      transferTypeSelect.addEventListener('change', () => this.onTransferTypeChange());
    }

    // Token address input blur event
    const tokenAddressInput = document.getElementById('tokenAddressInput');
    if (tokenAddressInput) {
      tokenAddressInput.addEventListener('blur', () => {
        if (window.fetchTokenInfo) {
          window.fetchTokenInfo();
        }
      });
    }
  }

  // Handle transfer type change
  onTransferTypeChange() {
    const type = document.getElementById('transferType').value;
    const tokenAddressRow = document.getElementById('tokenAddressRow');
    const approveBtn = document.getElementById('approveBtn');
    const sendBtn = document.getElementById('sendBtn');
    const tokenInfo = document.getElementById('tokenInfo');
    
    if (tokenAddressRow) {
      tokenAddressRow.style.display = type === 'erc20' ? 'flex' : 'none';
    }
    if (approveBtn) {
      approveBtn.style.display = type === 'erc20' ? 'inline-block' : 'none';
    }
    if (sendBtn) {
      sendBtn.style.display = type === 'eth' ? 'inline-block' : 'none';
    }
    if (tokenInfo) {
      tokenInfo.innerText = '';
    }
    
    this.updateStatus('');
  }

  // Add recipient input row
  addInput() {
    const container = document.getElementById('inputContainer');
    if (!container) return;
    
    const row = document.createElement('div');
    row.className = 'recipient-row';
    row.innerHTML = `
      <input type="text" placeholder="Recipient Address (0x...)" class="form-input address" />
      <input type="text" placeholder="Amount" class="form-input amount" />
      <div class="recipient-actions">
        <button onclick="addInput()" class="recipient-action-btn add-recipient-btn" title="Add Recipient">
          ➕
        </button>
        <button onclick="removeLast()" class="recipient-action-btn remove-recipient-btn" title="Remove Last">
          ❌
        </button>
      </div>
    `;
    
    container.appendChild(row);
    row.classList.add('slide-up');
    
    // Update remove buttons state
    this.updateRemoveButtons();
  }

  // Remove last recipient row
  removeLast() {
    const container = document.getElementById('inputContainer');
    if (!container) return;
    
    const rows = container.getElementsByClassName('recipient-row');
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      lastRow.style.opacity = '0';
      lastRow.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        container.removeChild(lastRow);
        this.updateRemoveButtons();
      }, 300);
    }
  }

  // Update remove buttons state
  updateRemoveButtons() {
    const rows = document.getElementsByClassName('recipient-row');
    const removeButtons = document.querySelectorAll('.remove-recipient-btn');
    
    removeButtons.forEach(btn => {
      btn.disabled = rows.length <= 1;
    });
  }

  // Import wallets from CSV
  importWallets() {
    const fileInput = document.getElementById('walletCsvInput');
    if (!fileInput || !fileInput.files[0]) {
      this.updateStatus('Please select a CSV file first', false, true);
      return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const wallets = e.target.result.split('\n')
        .map(line => line.trim())
        .filter(line => ethers.utils.isAddress(line));
      
      if (wallets.length > 0) {
        this.updateStatus(`✅ Successfully imported ${wallets.length} valid wallet addresses`, true, false);
      } else {
        this.updateStatus('No valid wallet addresses found in CSV file', false, true);
      }
    };
    
    reader.readAsText(file);
  }

  // Update status display
  updateStatus(message, isSuccess = false, isError = false) {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;
    
    statusElement.innerText = message;
    statusElement.style.display = message ? 'block' : 'none';
    
    // Remove existing classes
    statusElement.classList.remove('success', 'error', 'info');
    
    // Add appropriate class
    if (isSuccess) {
      statusElement.classList.add('success');
    } else if (isError) {
      statusElement.classList.add('error');
    } else {
      statusElement.classList.add('info');
    }
    
    // Auto-hide success messages after 5 seconds
    if (isSuccess) {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 5000);
    }
  }

  // Show loading screen
  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('show');
      loading.classList.remove('hidden');
    }
  }

  // Hide loading screen
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  // Get recipient data
  getRecipientData() {
    const addressElements = document.getElementsByClassName('address');
    const amountElements = document.getElementsByClassName('amount');
    const recipients = [];
    const amounts = [];
    
    for (let i = 0; i < addressElements.length; i++) {
      const address = addressElements[i].value.trim();
      const amount = amountElements[i].value.trim();
      
      if (!address || !amount) {
        throw new Error(`Please fill all fields in row ${i + 1}`);
      }
      
      if (!ethers.utils.isAddress(address)) {
        throw new Error(`Invalid address in row ${i + 1}`);
      }
      
      recipients.push(address);
      amounts.push(amount);
    }
    
    return { recipients, amounts };
  }

  // Get transfer type
  getTransferType() {
    const transferTypeSelect = document.getElementById('transferType');
    return transferTypeSelect ? transferTypeSelect.value : 'eth';
  }

  // Get token address
  getTokenAddress() {
    const tokenAddressInput = document.getElementById('tokenAddressInput');
    return tokenAddressInput ? tokenAddressInput.value.trim() : '';
  }

  // Update token info display
  updateTokenInfo(info) {
    const tokenInfoElement = document.getElementById('tokenInfo');
    if (tokenInfoElement) {
      tokenInfoElement.innerHTML = info;
      tokenInfoElement.style.display = 'block';
    }
  }

  // Show/hide approve button
  toggleApproveButton(show) {
    const approveBtn = document.getElementById('approveBtn');
    if (approveBtn) {
      approveBtn.style.display = show ? 'inline-block' : 'none';
    }
  }

  // Show/hide send button
  toggleSendButton(show) {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.style.display = show ? 'inline-block' : 'none';
    }
  }
}
