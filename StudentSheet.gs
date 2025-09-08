const WEB_APP_URL = "Insert_your_google_web_app_url_here";
const CORE_PROMPT_CELL = "B1";

function handleEdit(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  const row = range.getRow();
  const col = range.getColumn();

  if (col !== 1 || row < 3) return;

  const question = range.getValue();
  const corePrompt = sheet.getRange(CORE_PROMPT_CELL).getValue() || "";
  const user = Session.getActiveUser().getEmail();
const history = [];

for (let r = 2; r <= sheet.getLastRow(); r++) {
  const user = sheet.getRange(r, 1).getValue();
  const bot = sheet.getRange(r, 2).getValue();
  if (user) history.push({ role: "user", content: user });
  if (bot) history.push({ role: "assistant", content: bot });
}

  // Show loading indicator immediately
  const replyCell = sheet.getRange(row, 2);
  replyCell.setValue("🤖 Thinking...");
  SpreadsheetApp.flush(); // 🔁 Force update to appear in the UI


  const payload = {
  question: question,
  corePrompt: corePrompt,
  username: user,
  history: history
};


  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(WEB_APP_URL, options);
    const reply = response.getContentText();
    replyCell.setValue(reply);
  } catch (err) {
    replyCell.setValue("⚠️ Error calling bot: " + err.message);
  }
}




function setup() {
  // Force permission request for UrlFetchApp
  UrlFetchApp.fetch("https://httpbin.org/get");

  // Install the edit trigger if not already installed
  const triggers = ScriptApp.getProjectTriggers();
  const alreadyExists = triggers.some(t => t.getHandlerFunction() === "handleEdit");
  if (!alreadyExists) {
    ScriptApp.newTrigger("handleEdit")
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
      SpreadsheetApp.getActiveSpreadsheet().toast("✅ Chatbot enabled.");
  }

  
 else {
    SpreadsheetApp.getActiveSpreadsheet().toast("⚠️ Trigger already exists.");
  }
}


function debugFetch() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  try {
    const response = UrlFetchApp.fetch("https://httpbin.org/get");
    const text = response.getContentText();
    sheet.getRange("C1").setValue("✅ Success");
    sheet.getRange("C2").setValue(text);
  } catch (err) {
    sheet.getRange("C1").setValue("❌ Failed");
    sheet.getRange("C2").setValue(err.message);
  }
}


function testWebApp() {
  const url = WEB_APP_URL
  const payload = {
    question: "What is photosynthesis?",
    corePrompt: "You are a helpful science tutor for KS3 students."
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  try {
    const response = UrlFetchApp.fetch(url, options);
    const reply = response.getContentText();
    Logger.log(reply)
    sheet.getRange("D3").setValue(reply);
  } catch (e) {
    sheet.getRange("D3").setValue("Error: " + e.message);
  }
}


function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Chatbot")
    .addItem("Enable Chatbot", "setup")         // from earlier
    .addItem("Clear Chat", "clearChat")
    .addToUi();
}

function clearChat() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 3) {
    sheet.getRange(3, 1, lastRow - 1, 2).clearContent();
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("🧹 Chat cleared");
}


