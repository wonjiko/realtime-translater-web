/**
 * Google Apps Script - Translation Proxy
 *
 * Deploy this script as a Web App to use Google Translate
 * as a free translation backend for Real-Time Meeting Translator.
 *
 * Setup:
 * 1. Go to https://script.google.com and create a new project
 * 2. Replace the default code with this entire file
 * 3. Click Deploy > New deployment
 * 4. Select type: Web app
 * 5. Set "Execute as": Me
 * 6. Set "Who has access": Anyone
 * 7. Click Deploy and authorize
 * 8. Copy the Web App URL
 * 9. Paste into the app's Settings > GAS Web App URL field
 *
 * Limits:
 * - Free Google account: 5,000 translate calls/day
 * - Google Workspace: 10,000 translate calls/day
 */

function doPost(e) {
  try {
    var input = JSON.parse(e.postData.contents);
    var text = input.text;
    var from = input.from;
    var to = input.to;

    if (!text || !from || !to) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Missing required fields: text, from, to' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var translation = LanguageApp.translate(text, from, to);

    return ContentService
      .createTextOutput(JSON.stringify({ translation: translation }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
