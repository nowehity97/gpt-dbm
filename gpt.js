module.exports = {
  name: "AI GPT-4o Response",
  section: "Other Stuff",

  subtitle(data) {
    return `Temp message user: <span style="color:rgb(0,200,0)">${data.userMessageVarName}</span>, Save temp answer: <span style="color:rgb(0,192,255)">${data.responseVarName}</span>`;
  },
  
  
  
  variableStorage(data, varType) {
    const type = parseInt(data.responseVarType, 10);
    if (type !== varType) return;
    return [data.responseVarName, "Text"];
  },

  fields: [
    "apiKey",
    "userMessageVarName",
    "userMessageVarType",
    "responseVarName",
    "responseVarType",
    "systemMessage",
    "systemMessageType",
    "storage",
    "varName2"
  ],

  html(isEvent, data) {
    return `
          <u>Mod Info:</u><br>
      Created by hitstary<br>

    <div style="padding:10px">
      <div style="margin-bottom: 10px;">
        <label>API Key:</label><br>
        <input type="text" class="round" id="apiKey" placeholder="Paste API key https://github.com/settings/personal-access-tokens/new" style="width: 100%;">
      </div>
            <!-- User message variable -->
          <div style="margin-bottom: 10px;">
            <label>Variable with user message:</label><br>
            <select id="userMessageVarType" class="round" onchange="glob.variableChange(this, 'userVarNameContainer')">
              ${data.variables[0]}
            </select>
          </div>
          <div id="userVarNameContainer" style="margin-bottom: 10px;">
            <label>Variable name:</label><br>
            <input id="userMessageVarName" class="round" type="text" list="variableList">
          </div>

            <!-- Enter text to add during conversation (system) -->
          <div style="margin-bottom: 10px;">
            <label>Enter text to add during conversation (system):</label><br>
            <input id="systemMessage" class="round" type="text" placeholder="default: 'You are AI-Bot, an AI assistant.You may give short responses'">
          </div>

        <!-- Variable to save the response -->
<div style="margin-bottom: 10px;">
  <label>Where to save the answer:</label><br>
  <select id="responseVarType" class="round" onchange="glob.variableChange(this, 'varNameContainer2')">
    ${data.variables[0]}
  </select>
</div>
<div id="varNameContainer2" style="margin-bottom: 10px;">
  <label>Variable name:</label><br>
  <input id="responseVarName" class="round" type="text"> 
</div>


        </div>
      </div>
    </div>`;
  },

  init() {
    const { glob, document } = this;
    glob.variableChange(document.getElementById('userMessageVarType'), 'userVarNameContainer');
    glob.variableChange(document.getElementById('responseVarType'), 'varNameContainer2');
  },

  async action(cache) {
    const data = cache.actions[cache.index];
    const fetch = require("node-fetch");

    const OPENAI_KEY = this.evalMessage(data.apiKey, cache);
    const userMessage = this.getVariable(parseInt(data.userMessageVarType), this.evalMessage(data.userMessageVarName, cache), cache);
    const systemMessage = this.evalMessage(data.systemMessage, cache);
    const endpoint = 'https://models.inference.ai.azure.com/openai/deployments/gpt-4o/chat/completions';
    const responseVarName = this.evalMessage(data.responseVarName, cache);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': OPENAI_KEY
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              "role": "system",
              "content": systemMessage || "You are AI-Bot, an AI assistant.You may give short responses, unless required depending on what you ask for." },
            { "role": "user", "content": userMessage }
          ],
          temperature: 1,
          max_tokens: 4096,
          top_p: 1
        })
      });

      const dataRes = await response.json();

      if (dataRes.error) {
        console.error("OpenAI Error:", dataRes.error);
      } else {
        const content = dataRes.choices?.[0]?.message?.content;
        if (content) {
          this.storeValue(content, parseInt(data.responseVarType), responseVarName, cache);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }

    this.callNextAction(cache);
  },

  mod() {}
};
