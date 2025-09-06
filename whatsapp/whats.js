const express = require("express");
const qrcode = require("qrcode");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");

const whats = express.Router();

let qrCodeData = null;
let clientReady = false;

// ✅ WhatsApp Client Init
const client = new Client

// 🔹 QR generate
client.on("qr", async (qr) => {
  qrCodeData = await qrcode.toDataURL(qr);
  console.log("📱 Scan QR Code...");
});

// 🔹 Client ready
client.on("ready", () => {
  clientReady = true;
  console.log("✅ WhatsApp Client Ready");
});

// 🔹 Log incoming messages
client.on("message", (msg) => {
  console.log(`📩 ${msg.from}: ${msg.body}`);
});

// 👉 API to get QR Code
whats.get("/get-qr", (req, res) => {
  res.json({ qr: qrCodeData, ready: clientReady });
});

// 👉 Dummy Auth Middleware (आप चाहो तो टोकन चेक लगा सकते हो)
function authMiddleware(req, res, next) {
  // Example: header से token verify
  const token = req.headers["authorization"];
  if (token === "Bearer bNzxay2Pvqh831iEcDviOfdv8hv4H2BY") {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// 👉 API to send text message
whats.post("/send-message", authMiddleware, async (req, res) => {
  const { number, message } = req.body;
  if (!clientReady) return res.status(500).json({ error: "Client not ready" });

  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true, number, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateInvoice(userData, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ===== Header Section =====
      doc
        .rect(0, 0, 595, 100) // light blue header rectangle
        .fill("#3f51b5");

      doc.fillColor("white")
        .fontSize(24)
        .text("Ghatak Suppert Team", 50, 30)
        .fontSize(14)
        .text("Payment Invoice", 50, 65);

      doc.moveDown(4);

      // ===== Customer Info =====
      doc.fillColor("black");
      doc.fontSize(12)
        .text(`Customer Name: ${userData.name}`, 50)
        .text(`Phone Number: ${userData.number}`)
        .text(`Email: ${userData.email || "-"}`);

      doc.moveDown(1);

      // ===== Payment Table Header =====
      const tableTop = doc.y + 20;
      doc.fillColor("#eeeeee")
        .rect(50, tableTop, 500, 20)
        .fill();

      doc.fillColor("black")
        .fontSize(12)
        .text("Description", 55, tableTop + 5)
        .text("Amount (₹)", 450, tableTop + 5);

      // ===== Table Row =====
      const rowTop = tableTop + 25;
      doc.rect(50, rowTop, 500, 20).stroke();
      doc.text("Payment Received", 55, rowTop + 5)
        .text(`${userData.amount}`, 450, rowTop + 5);

      // ===== Transaction Info =====
      doc.moveDown(4);
      doc.text(`Transaction ID: ${userData.txnId}`);
      doc.text(`Payment Date: ${new Date().toLocaleString()}`);

      // ===== Footer =====
      doc.moveDown(4);
      doc.fontSize(12).fillColor("green").text("✅ Payment Successful", { align: "center" });
      doc.moveDown(2);
      doc.fontSize(10).fillColor("black")
        .text("Thank you for your business! Contact: support@company.com", { align: "center" });

      doc.end();

      stream.on("finish", () => resolve(true));
    } catch (err) {
      reject(err);
    }
  });
}


// ✅ API: Send Invoice
whats.post("/send-invoice", authMiddleware, async (req, res) => {
  if (!clientReady) return res.status(500).json({ error: "WhatsApp client not ready" });

  const { name, number, amount, txnId } = req.body;
  if (!name || !number || !amount || !txnId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // 1. Generate PDF Invoice
    const filePath = `invoice_${txnId}.pdf`;
    await generateInvoice({ name, number, amount, txnId }, filePath);

    // 2. Send PDF on WhatsApp
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    const media = MessageMedia.fromFilePath(filePath);

    await client.sendMessage(chatId, media, { caption: "Here is your payment invoice 📄" });

    res.json({ success: true, message: "Invoice sent successfully" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

client.initialize();

module.exports = whats;
