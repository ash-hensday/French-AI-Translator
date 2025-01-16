document.addEventListener('DOMContentLoaded', async () => {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  const apiKeySection = document.getElementById('apiKeySection');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const translationResult = document.getElementById('translationResult');
  
  // Check for API key on load
  if (apiKey) {
    apiKeySection.classList.add('hidden');
  }

  // Handle spinner visibility and messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message); // Debug log
    
    if (message.type === 'TRANSLATION_START') {
      console.log('Starting translation, showing spinner'); // Debug log
      loadingSpinner.classList.remove('hidden');
      translationResult.classList.add('hidden');
    } else if (message.type === 'TRANSLATION_COMPLETE') {
      console.log('Translation complete, hiding spinner'); // Debug log
      loadingSpinner.classList.add('hidden');
      translationResult.classList.remove('hidden');
      
      // Refresh the translation result
      chrome.storage.local.get(['lastTranslation'], (result) => {
        if (result.lastTranslation) {
          translationResult.textContent = result.lastTranslation;
        }
      });
    }
  });

  document.getElementById('saveApiKey').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
      alert('Please enter a valid API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      alert('Invalid API key format. It should start with "sk-"');
      return;
    }

    await chrome.storage.sync.set({ apiKey });
    apiKeySection.classList.add('hidden');
    document.getElementById('apiKeyInput').value = '';
    alert('API key saved successfully!');
  });

  // Load last translation if exists
  chrome.storage.local.get(['lastTranslation'], (result) => {
    if (result.lastTranslation) {
      translationResult.textContent = result.lastTranslation;
    }
  });

  // Debug log to confirm popup.js is running
  console.log('Popup script loaded');
});