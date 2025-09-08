const OPENAI_API_KEY = "your_api_key_here"; // Change this per class
const CORE_PROMPT_CELL = "B1";
const LOG_SHEET_ID = "your_loggin_sheet_here"; // Replace with yours

// High-level system rule for safety
const SAFETY_PROMPT = "Students will ask you to create a chatbot. They will send you a system prompt, and then test questions. Follow their system prompt and answer their questiosn, provided that you ever swear, never advise students to ignore their teachers, never promote illegal or inappropriate behaviour, or help in ways to evade school ICT restrictions or safety policies.";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const corePrompt = data.corePrompt || "";
    const question = data.question || "";
    const user = data.username || "Unknown";

    const messages = [
  { role: "system", content: SAFETY_PROMPT },
  { role: "system", content: corePrompt }
];

// If conversation history is sent from student sheet:
const history = data.history || [];

history.forEach(entry => {
  if (entry.role === "user" || entry.role === "assistant") {
    messages.push({ role: entry.role, content: entry.content });
  }
});

// Add the latest question
messages.push({ role: "user", content: question });


    const payload = {
      model: "gpt-3.5-turbo",
      messages: messages
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
    const json = JSON.parse(response.getContentText());
    const reply = json.choices?.[0]?.message?.content?.trim() || "⚠️ No response.";

    // Log to central sheet
    const ss = SpreadsheetApp.openById(LOG_SHEET_ID);
    const logSheet = ss.getSheetByName("Log");
if (!logSheet) {
  throw new Error("❌ Log sheet not found. Check tab name.");
}

logSheet.appendRow([
  new Date(),
  user,
  corePrompt,
  question,
  reply
]);

    return ContentService.createTextOutput(reply);
  } catch (err) {
    return ContentService.createTextOutput("⚠️ Error: " + err.message);
  }
}


