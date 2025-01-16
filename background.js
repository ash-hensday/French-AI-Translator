chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateFrench",
    title: "Translate and Explain",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translateFrench") {
    const selectedText = info.selectionText;
    
    // Check if API key exists
    const { apiKey } = await chrome.storage.sync.get('apiKey');
    if (!apiKey) {
      chrome.storage.local.set({ 
        'lastTranslation': 'Please set your OpenAI API key in the extension popup first.' 
      });
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Action Required',
        message: 'Please set your OpenAI API key in the extension popup first.'
      });
      return;
    }

    // Show spinner first, then open popup
    chrome.runtime.sendMessage({ type: 'TRANSLATION_START' });
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure message is received
    chrome.action.openPopup();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              "role": "system",
              "content": "You are a French tutor for English speakers. Your job is to translate a specified text, and provide an explanation of the vocabulary, verb conjugations, tense, and moods (if tense and mood are not present and indicative). Try to emphasize aspects that may be confusing such as idiomatic phrases or grammatical concepts that aren't present in English. Keep responses short and concise. If the selected text is not in french, simply return Sacre Bleu! C'est pas francais!"
            },
            {
              "role": "user",
              "content": selectedText
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed. Please check your API key.');
      }

      const data = await response.json();
      const result = data.choices[0].message.content;
      
      // Store result first, then send complete message
      await chrome.storage.local.set({ 'lastTranslation': result });
      chrome.runtime.sendMessage({ type: 'TRANSLATION_COMPLETE' });
      
    } catch (error) {
      console.error('Translation error:', error);
      await chrome.storage.local.set({ 
        'lastTranslation': `Error: ${error.message}` 
      });
      chrome.runtime.sendMessage({ type: 'TRANSLATION_COMPLETE' });
    }
  }
});