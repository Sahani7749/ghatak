// server.js
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const admin = require("firebase-admin");

const puppeteer = require("puppeteer-core");

//   MQTT Line Code 

const mqtt = require('mqtt');
// const aedes = require('aedes')();
const net = require('net');
const http = require('http');

const userRoutes = require('./routes/users');

const whatsappRoutes = require('./whatsapp/whats');




const aedes = require("aedes")({
  heartbeatInterval: 60000,   // 60 सेकंड
  connectTimeout: 120000      // 120 सेकंड
});







const COMMANDS_FILE = path.join(__dirname, 'commands.json');
const DEVICES_FILE = path.join(__dirname, 'devices.json'); 
 const COMMANDS_FILE_FCM_MQTT = path.join(__dirname, "commandsFQ.json");


if (!fs.existsSync(DEVICES_FILE)) fs.writeFileSync(DEVICES_FILE, JSON.stringify({}));

function readDevices() {
    try { return JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8')); } 
    catch(e){ return {}; }
}

function writeDevices(list) {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(list, null, 2));
}



if (!fs.existsSync(COMMANDS_FILE)) fs.writeFileSync(COMMANDS_FILE, JSON.stringify([]));

// --- Helper Functions ---
function readCommands() {
    try {
        return JSON.parse(fs.readFileSync(COMMANDS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeCommands(list) {
    fs.writeFileSync(COMMANDS_FILE, JSON.stringify(list, null, 2));
}

function logEvent(msg){
    console.log(new Date().toISOString(), ' | ', msg);
}



// MQTT LIne of Code 

// MQTT broker over TCP
const tcpServer = net.createServer(aedes.handle);

const MQTT_PORT = 1883;

tcpServer.listen(MQTT_PORT, () => {
  console.log(`🚀 MQTT Broker running on port ${MQTT_PORT}`);
});








// ✅ CommandsDB Load/Save Utility
function loadCommands() {
  if (fs.existsSync(COMMANDS_FILE_FCM_MQTT)) {
    return JSON.parse(fs.readFileSync(COMMANDS_FILE_FCM_MQTT, "utf-8"));
  }
  return [];
}

function saveCommands(commands) {
  fs.writeFileSync(COMMANDS_FILE_FCM_MQTT, JSON.stringify(commands, null, 2));
}

let commandsDB = loadCommands(); // Startup पर load







const PORT = process.env.PORT || 3000;

// Replace with your own Bearer token
const STATIC_BEARER = "bNzxay2Pvqh831iEcDviOfdv8hv4H2BY";





const serviceAccount = {
  "type": "service_account",
  "project_id": "surya-key",
  "private_key_id": "21d1a63ac40139365dfad6abf6537a4b3f9c0b7e",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDCBSMXQSV8x2pt\nXPW/uSMS41vzBWUrzScYgQTHprgORTpNpTNleT6seIBHm3ChW0HLI7HIZPUPQEUC\ny68ipfTIXsOteVZKoEHmOgXr43zciKgtaYfTnp6s073sXG3rnVIOkvvqTGhYodpa\nj/5n0CAzLX5uvBnssGVSFyI+JLRvEUofvr7jqzc0yUwhkc5YN9Edyac4jyjsUipQ\nkdljQFiRS4RatsfOAG31tQxfDHCaZ0x8MvBdQ9GLQsF2VKys6IJ0JRoyOgbxpYGo\nEV2v0lBc/ylN3CtBmMFi4WBdV9uqtVoR8F/tgU8+WII1zwpFpXslHZSu6t5s6O1c\n6vqCGMfHAgMBAAECggEAAMX5lGMmMv3nKJWL8FOVllDokeqhekVUER7Ta0YVLfMo\n6Y4YPOfceqWCiPEzHPNQDpnIJ70a1WXzZ5Q50NDC+HV8rtlUaGOEsYDJCXqp3xQM\nz47cdWclAhnJ9eXHFX8A7Cvy6/59TjUigKxaCSHlIL1Q55WlBUDUhMeUYbHrF4eR\nVgMjx0+d2FIjCKGF5QcX//pqaYh+loj3PX8WN2uvJiXuT9ClEJgfZIypkOnTrEcZ\njdLLUzPjT9UeMwOWYVKUiGIYXapdB8DyvuTjQ2ySPr3JTOSReUfDIZdKrmH7qVkI\nOFa4UATKxQyu54WYpw13iImcUzWdfQCdCHmL53m4aQKBgQDgVS1bD4qRTLjDzUd6\nTsqDwn2z6ukdoZ4QpRAUSwTXpw1vRtCFO7lWJ8yWAaXtNwedUuDuaLn7kxpQ/XU0\n+CnZ7OpI4K7INQg2nYQklff+eXX1JW3POy5MdacGPu2tyHYn2e8t2iUqyiKssPWj\ni1kiNulhogJyO/01ZJzCv4VxgwKBgQDdaIlRvyj9FGaI4iwx9YLxtbQaHkOZCZbP\nt2HR4campXRnNj4IvAQ/U3Y7i2cHCtnqJWK9d27fEDypZq341CTUclxiRIZRBj65\nEMp7i3pirZrNkkq4S1RiZVrAk5UluDBgBkz/euumFEUfsJFc8e7H/mVxgwDIk+kt\n64q3P59RbQKBgQC7SSFWlsD+0Winv2ffSox0OBmt7X61iEpoZwXni0H9sK/cqOhJ\nczUmIpAA5Ftckca/p4O2RqSOzZ744sHJeS2njM2EDmCdMPksb5D04mdqgojiI19r\n1WKv3sGUy1Cu9179okq2oxrIgH02Y36QDTRbBjENm64jJMYen2Loi/CidQKBgB6M\nF7YRm8QfFm54VgSmjORwX2LjHgx1SDtsX7CnZ9MCLOc4kqJ93lAmYb+hYhuUobAu\nbEsbuU5JXTU6F3KnQlWVWa2tKqLvK6Q47tbQzZfjv+Hw9yIqMoBI35aGRiOoH/R/\nqgvtl6mYTlkq8UNTldA+Bxz8KBWEYr2VK9RQkNiZAoGAJadAo9klsM9MWfkxxK6R\nhr99n/OlojfzX5yXcIaJ+MBWfJQWih/7x5kcAZc65Di8Mt9iTfO5fOfV7iUc/vwE\nBKEfbJKmv5OnrMgxdpWSCToOeZ1qGeLnk3xHi7Bp9MVzjwpBISB6Lx9JFXn+IKfE\n4mrCyV2kaXc2q3/g1nvsDsE=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@surya-key.iam.gserviceaccount.com",
  "client_id": "111970893328857736547",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40surya-key.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});





(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto("https://google.com");
  console.log(await page.title());
  await browser.close();
})();






// --- In-memory connected clients ---
const clients = {};

// --- Express App ---
const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use('/user', userRoutes);
app.use('/user', whatsappRoutes);

app.use(express.static(path.join(__dirname, 'public')));


// favicon को public serve करें
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, 'public', 'favicon.ico')));

// या middleware exclude करें
app.use((req, res, next) => {
  if (req.path === '/favicon.ico') return res.status(204).end(); // No Content
  next();
});


app.use(express.static(__dirname)); // serve all files from project root

const HTTP_PORT = 3000;
const WS_PORT = 8080;

 const devices = {}; // imei -> { ws, info }


// --- WebSocket Server ---
const wss = new WebSocket.Server({ port: WS_PORT }, () => {
    logEvent(`WebSocket server listening on ws://0.0.0.0:${WS_PORT}`);
});

wss.on('connection', (ws, req) => {
    logEvent('New WS connection');
    let registeredImei = null;

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);

            // Device Registration
            if(data.type === 'register' && data.imei){
                registeredImei = data.imei;
                clients[registeredImei] = ws;
                logEvent('Registered IMEI: ' + registeredImei);
                ws.send(JSON.stringify({ type:'registered', imei: registeredImei }));

            // ACK from device
            } else if(data.type === 'ack' && data.cmdId){
                const all = readCommands();
                const idx = all.findIndex(c => c.id === data.cmdId);
                if(idx !== -1){
                    all[idx].status = 'executed';
                    all[idx].executedAt = new Date().toISOString();
                    writeCommands(all);
                    logEvent('Command acked: ' + data.cmdId);
                }
            }
        } catch(err){
            logEvent('Invalid WS message: ' + err.message);
        }
    });


   
 ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);

            if(data.type === 'register' && data.imei){
                registeredImei = data.imei;

                // Save device info
                devices[registeredImei] = {
                    ws,
                    info: {
                        name: data.name || '-',
                        imei1: data.imei1 || '-',
                        imei2: data.imei2 || '-',
                        model: data.model || '-',
                        os: data.os || '-',
                        appVersion: data.appVersion || '-',
                        battery: data.battery || '-',
                        lastActive: new Date().toISOString(),
                        ua: data.ua || '-'
                    }
                };

                writeDevices(devices);

                clients[registeredImei] = ws; // existing WS map
                ws.send(JSON.stringify({ type:'registered', imei: registeredImei }));
                logEvent('Registered IMEI with info: ' + JSON.stringify(devices[registeredImei].info));
            }
        } catch(err) {
            logEvent('Invalid WS message: ' + err.message);
        }
    });











    ws.on('close', () => {
        if(registeredImei && clients[registeredImei] === ws){
            delete clients[registeredImei];
            logEvent('Client disconnected: ' + registeredImei);
        }
    });

    ws.on('error', (e) => logEvent('WS error: ' + e.message));
});

// --- HTTP API ---
// Root
app.get('/', (req,res) => res.send('EMI WebSocket Server API running'));


// GET /clientsInfo
app.get('/clientsInfo', (req, res) => {
    const now = new Date();
    const infoList = Object.keys(devices).map(imei => {
        const device = devices[imei];
        const lastActive = new Date(device.info.lastActive);
        const isActive = (now - lastActive) / 1000 < 60 * 2; // 2 min me active → online

        // Find last command sent to this IMEI
        const allCommands = readCommands().filter(c => c.imei === imei);
        const lastCommand = allCommands.length ? allCommands[allCommands.length - 1] : null;

        return {
            imei,
            name: device.info.name || '-',
            model: device.info.model || '-',
            android: device.info.os || '-',
            battery: device.info.battery || '-',
            lastSeen: device.info.lastActive || '-',
            ua: device.info.ua || '-',
            appVersion: device.info.appVersion || '-',
            active: isActive,
            lastCommand: lastCommand ? { action: lastCommand.action, status: lastCommand.status } : null
        };
    });

    res.json({ success: true, connected: infoList });
});






// Send Command
// GET /send?imei=...&action=LOCK
app.get('/send', (req,res) => {
    const { imei, action } = req.query;
    if(!imei || !action) return res.status(400).json({ success:false, message:'imei and action required' });

    const cmd = {
        id: uuidv4(),
        imei,
        action,
        createdAt: new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        lastTry: null
    };

    const list = readCommands();
    list.push(cmd);
    writeCommands(list);

    const ws = clients[imei];
    if(ws && ws.readyState === WebSocket.OPEN){
        try{
            ws.send(JSON.stringify({ type:'command', id: cmd.id, action: cmd.action }));
            logEvent('Pushed command to connected device: ' + imei + ' ' + action);
        } catch(e){
            logEvent('Failed to push via WS: ' + e.message);
        }
    } else {
        logEvent('Client not connected, command stored for IMEI: ' + imei);
    }

    return res.json({ success:true, message:'Command stored', cmdId: cmd.id });
});

// Fetch Pending Commands
// GET /fetchPending?imei=...
app.get('/fetchPending', (req,res)=>{
    const { imei } = req.query;
    if(!imei) return res.status(400).json({ success:false, message:'imei required' });
    const list = readCommands();
    const pending = list.filter(c => c.imei===imei && c.status==='pending');
    res.json({ success:true, pending });
});

app.get('/fetchAllPending', (req, res) => {
    const list = readCommands();
    const pending = list.filter(c => c.status === 'pending');
    res.json({ success: true, pending });
});


// Health Check Endpoint
app.get('/health', (req, res) => {
    const pendingCommands = readCommands().filter(c => c.status === 'pending');
    const connectedClients = Object.keys(clients);

    res.json({
        success: true,
        serverTime: new Date().toISOString(),
        httpServer: "UP",
        websocketServer: "UP",
        activeClients: connectedClients.length,
        connectedClients: connectedClients,
        pendingCommands: pendingCommands.length
    });
});

// ACK
// POST /ack { "cmdId": "...", "imei": "..." }
app.post('/ack', (req,res)=>{
    const { cmdId } = req.body;
    if(!cmdId) return res.status(400).json({ success:false, message:'cmdId required' });

    const list = readCommands();
    const idx = list.findIndex(c => c.id===cmdId);
    if(idx===-1) return res.status(404).json({ success:false, message:'Command not found' });

    list[idx].status = 'executed';
    list[idx].executedAt = new Date().toISOString();
    writeCommands(list);

    res.json({ success:true, message:'ACK saved' });
});


// GET /device/:imei
app.get('/device/:imei', (req,res)=>{
    const imei = req.params.imei;
    const device = devices[imei];
    if(!device) return res.status(404).json({ success:false, message:'Device not found' });

    const list = readCommands();
    const executed = list.filter(c=>c.imei===imei && c.status==='executed');
    const pending = list.filter(c=>c.imei===imei && c.status==='pending');

    res.json({
        success:true,
        deviceInfo: device.info,
        executedCommands: executed,
        pendingCommands: pending
    });
});



// clients info storage








// Status API
// GET /status/:imei
app.get('/status/:imei', (req,res)=>{
    const imei = req.params.imei;
    const list = readCommands();
    const executed = list.filter(c=>c.imei===imei && c.status==='executed');
    const pending = list.filter(c=>c.imei===imei && c.status==='pending');
    res.json({ success:true, executed, pending });
});

// Connected Clients
app.get('/clients', (req,res)=>{
    res.json({ connected: Object.keys(clients) });
});

// --- Retry Pending Commands Automatically ---
// --- Retry Pending Commands Automatically with limit (30) ---
setInterval(()=>{
    let list = readCommands();
    list.forEach(cmd => {
        if(cmd.status==='pending'){
            // अगर attempts 30 से कम हैं तभी retry करो
            if(!cmd.attempts) cmd.attempts = 0;

            if(cmd.attempts < 30){
                const ws = clients[cmd.imei];
                if(ws && ws.readyState===WebSocket.OPEN){
                    try{
                        ws.send(JSON.stringify({ type:'command', id: cmd.id, action: cmd.action }));
                        cmd.attempts += 1;
                        cmd.lastTry = new Date().toISOString();
                        logEvent('Retry pushed command to: ' + cmd.imei + ' ' + cmd.action + ' (attempt ' + cmd.attempts + ')');
                    }catch(e){
                        logEvent('Retry failed for IMEI: ' + cmd.imei);
                    }
                }
            } else {
                // अगर 30 बार हो गया तो status = failed कर दो
                cmd.status = 'failed';
                logEvent('Command failed after 30 attempts: ' + cmd.imei + ' ' + cmd.action);
            }
        }
    });
    writeCommands(list);
}, 10000); // every 10 sec


// --- Cleanup old executed commands (30 days) ---
setInterval(()=>{
    let list = readCommands();
    const now = new Date();
    list = list.filter(cmd=>{
        if(cmd.status==='executed'){
            const executedDate = new Date(cmd.executedAt);
            const diffDays = (now - executedDate)/(1000*60*60*24);
            return diffDays < 30;
        }
        return true;
    });
    writeCommands(list);
}, 24*60*60*1000); // daily




// Firebase Message 


// ✅ Middleware for Bearer token check
app.use((req, res, next) => {
  const auth = req.headers["authorization"];
  if (!auth || auth !== `Bearer ${STATIC_BEARER}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});



// ✅ Save Command to DB
function saveCommand(imei, command, protocol) {
  const cmd = {
    id: Date.now().toString(),
    imei,
    command,
    protocol,
    status: "pending",
    createdAt: new Date(),
    sentAt: null,
    deliveredAt: null,
    error: null
  };
  commandsDB.push(cmd);
  return cmd;
}







// ✅ FCM Command Sender API
app.post("/send-command", async (req, res) => {
  let cmd; // command log reference (scope for try & catch)
  
  try {
    const { imei, command, fcm_token, topic, send_type } = req.body;

    // 🔎 Validation
    if (!command) {
      return res.status(400).json({ error: "❌ Command is required" });
    }

    // 📝 Save command in DB/log before sending
    cmd = saveCommand(imei || fcm_token || topic, command, "FCM"); // imei optional
    
    // 🔥 FCM Message Format
    const message = {
      data: { command },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    };

    // 🔥 Send Type Handling
    if (send_type === true && fcm_token) {
      message.token = fcm_token; // Single Device
    } else if (send_type === false && topic) {
      message.topic = topic; // Topic / Group
    } else {
      return res.status(400).json({
        error: "❌ Invalid send_type or missing fcm_token/topic",
      });
    }

    // 🚀 Send FCM
    const response = await admin.messaging().send(message);

    // ✅ Update command log
    cmd.status = "sent";
    cmd.sentAt = new Date();

    return res.status(200).json({
      success: true,
      response,
      commandLog: cmd,
    });

  } catch (error) {
    console.error("FCM Error:", error);

    if (cmd) {
      cmd.status = "failed";
      cmd.error = error.message;
    }

    return res.status(500).json({ error: error.message });
  }
});


// ✅ POST /send-notification endpoint
app.post("/send-notification", async (req, res) => {
  const { title, body, fcm_token, topic, send_type } = req.body;

  const message = {
    data: {
      title: title || "",
      body: body || ""
    },
    android: {
      priority: "high"
    },
    apns: {
      payload: {
        aps: {
          sound: "default"
        }
      }
    }
  };

  if (send_type === true && fcm_token) {
    message.token = fcm_token;
  } else if (send_type === false && topic) {
    message.topic = topic;
  } else {
    return res.status(400).json({ error: "Invalid send_type or missing token/topic" });
  }

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
















//  MQTT Code oF Line 
// ✅ Send Command via MQTT
app.post('/sendCommandmqtt', (req, res) => {
  const { imei, command } = req.body;
  if (!imei || !command) return res.status(400).send({ error: 'imei & command required' });

  const cmd = saveCommand(imei, command, "MQTT");
  const topic = `devices/${imei}/cmd`;
  const payload = JSON.stringify({ command, ts: Date.now() });

  aedes.publish({ topic, payload, qos: 2, retain: true }, (err) => {   // 🔑 retain: true जोड़ा
    if (err) {
      cmd.status = "failed";
      cmd.error = err.message;
      return res.status(500).send({ error: err.message });
    }
    cmd.status = "sent";
    cmd.sentAt = new Date();
    console.log(`✅ [QoS2 + Retain] Sent command "${command}" to ${topic}`);
    res.send({ success: true, command: cmd });
  });
});




app.post("/command-ack", (req, res) => {
  const { imei, command } = req.body;

  // सारे match commands निकालो
  const cmds = commandsDB.filter(c => c.imei === imei && c.command === command && c.status === "sent");

  let updated = null;
  if (cmds.length > 0) {
    // सिर्फ last वाला update होगा
    updated = cmds[cmds.length - 1];
    updated.status = "delivered";
    updated.deliveredAt = new Date();
  }

  res.json({ success: true, updated });
});


// ✅ Status Monitoring API
app.get("/statuss/:imei", (req, res) => {
  const imei = req.params.imei;
  const commands = commandsDB.filter(c => c.imei === imei);
  res.json({ imei, commands });
});








function getTimeStamp() {
  const now = new Date();
  const date = now.toLocaleDateString("en-IN"); // DD/MM/YYYY (Indian format)
  const time = now.toLocaleTimeString("en-IN"); // HH: MM:SS AM/PM
  return `${date} ${time}`;
}




let onlineDevices = {}; // IMEI → status

aedes.on("client", client => {
  const imei = client.id;
  onlineDevices[imei] = { status: "ONLINE", lastSeen: new Date() };
  console.log(`[${getTimeStamp()}] ✅ Device connected: ${imei}`);
});

aedes.on("clientDisconnect", client => {
  const imei = client.id;
  onlineDevices[imei] = { status: "OFFLINE", lastSeen: new Date() };

  // Disconnect log
  console.log(`[${getTimeStamp()}] ❌ Device disconnected: ${imei}`);

  // Detailed reason check
  if (client.closeError) {
      console.log(`⚠️ Client disconnected: ${imei} | reason: ${client.closeError.message || client.closeError}`);
  } else {
      console.log(`⚠️ Client disconnected: ${imei} | reason: unknown`);
  }



  // Optional: network info if available
  if (client.conn && client.conn.stream) {
      console.log(`   Remote address: ${client.conn.stream.remoteAddress}`);
      console.log(`   Remote port   : ${client.conn.stream.remotePort}`);
  }
});


aedes.on("subscribe", (subs, client) => {
  console.log(`📩 Client ${client ? client.id : "unknown"} subscribed to:`, subs.map(s => s.topic));
});

aedes.on("publish", (packet, client) => {
  if (client) {
    console.log(`📤 Client ${client.id} published to ${packet.topic}: ${packet.payload.toString()}`);
  }
});


// Debug
aedes.on("pingreq", (client) => {
  console.log("📡 Got PINGREQ from:", client.id);
});
aedes.on("keepaliveTimeout", client => {
  console.log(`⚠️ Keepalive timeout for ${client.id}`);
});

setInterval(() => {
  console.log("💓 Broker heartbeat running...");
}, 60000);  // हर 60 सेकंड


// Reject invalid Client ID
aedes.authenticate = function (client, username, password, callback) {
  if (!client.id || client.id.length < 3) {
    console.log(`[${new Date().toLocaleString()}] ❌ Rejecting client with invalid clientId: ${client.id}`);
    const error = new Error('Invalid clientId');
    error.returnCode = 2; // Identifier Rejected
    return callback(error, null);
  }

  // Allow all for now
  callback(null, true);
};








app.get("/onlineDevice/:imei", (req, res) => {
  const imei = req.params.imei;
  const device = onlineDevices[imei];

  if (device) {
    res.json({ imei, status: device.status, lastSeen: device.lastSeen });
  } else {
    res.json({ imei, status: "UNKNOWN" });
  }
});


// ✅ API: Send Command via MQTT
// app.post('/sendCommandmqtt', (req, res) => {
//   const { imei, command } = req.body;
//   if (!imei || !command) return res.status(400).send({ error: 'imei & command required' });

//   // Save to DB
//   const cmd = saveCommand(imei, command);

//   // If device is online → send immediately
//   if (deviceStatus[imei] === "online") {
//     deliverPendingCommands(imei);
//   }

//   res.send({ success: true, command: cmd });
// });








// ✅ Cleanup function (30 days old delete)
function cleanupOldCommands() {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  commandsDB = commandsDB.filter((c) => {
    const createdAt = new Date(c.createdAt).getTime();
    return now - createdAt < THIRTY_DAYS;
  });

  saveCommands(commandsDB);
  console.log("✅ Cleanup done, old data removed");
}

// हर दिन cleanup चलाओ (24 घंटे में 1 बार)
setInterval(cleanupOldCommands, 24 * 60 * 60 * 1000);
































// app.listen(3000, () => console.log('📡 REST API running on port 3000')); // MQTT


//  Server oFF and oN



let wsEnabled = false;
let mqttEnabled = false;
let wsServer = null; // 🟢 WS server global variable



//app.use(express.json({ strict: false }));


// Status API
app.get('/status', (req, res) => {
    res.json({ ws: wsEnabled, mqtt: mqttEnabled });
});

// WebSocket On/Off with Authorization



// // WebSocket ON/OFF route
app.post('/ws/:action', (req, res) => {
    const { action } = req.params;

    if(action === 'on' && !wsEnabled){
        wsServer = new WebSocket.Server({ port: 8080 }, () => {
            wsEnabled = true;
            console.log("✅ WebSocket Server ON");
            return res.json({ success:true, message:'WebSocket ON', ws: wsEnabled });
        });

        wsServer.on('connection', ws => {
            console.log('Client connected');
        });

    } else if(action === 'off' && wsEnabled){
        // बंद करने से पहले सभी connected clients को बंद करो
        wsServer.clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN){
                client.close();
            }
        });

        wsServer.close(() => {
            wsEnabled = false;
            wsServer = null;
            console.log("❌ WebSocket Server OFF");
            return res.json({ success:true, message:'WebSocket OFF', ws: wsEnabled });
        });

    } else {
        return res.json({ success:false, message:'Invalid action or already in desired state', ws: wsEnabled });
    }
});




// MQTT On/Off with Authorization
// app.post('/mqtt/:action', (req,res)=>{
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if(token !== "bNzxay2Pvqh831iEcDviOfdv8hv4H2BY") {
//         return res.status(401).json({ success:false, message:'Unauthorized' });
//     }

//     const { action } = req.params;

//     if(action==='on' && !mqttEnabled){
//         mqttServer.listen(1883, ()=> {
//             mqttEnabled=true;
//             console.log("✅ MQTT Server ON");
//             res.json({ success:true, message:'MQTT ON', mqtt: mqttEnabled });
//         });
//     } else if(action==='off' && mqttEnabled){
//         mqttServer.close(()=> {
//             mqttEnabled=false;
//             console.log("❌ MQTT Server OFF");
//             res.json({ success:true, message:'MQTT OFF', mqtt: mqttEnabled });
//         });
//     } else {
//         res.json({ success:false, message:'Invalid action or already in desired state', mqtt: mqttEnabled });
//     }
// });











// --- Start HTTP Server ---
app.listen(HTTP_PORT, ()=>{
    logEvent(`HTTP API running on http://0.0.0.0:${HTTP_PORT}`);
     console.log(`🚀 Server running on port ${PORT}`);
     console.log('📡 MQTT REST API running on port 3000')
});


// Local MQTT client for testing
const client = mqtt.connect('mqtt://localhost:1883');
client.on('connect', () => console.log('📲 Local client connected to broker'));
