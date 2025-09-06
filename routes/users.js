const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const upload = multer({ dest: 'uploads/' });

// Helper functions
const readJson = () => fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) : [];
const writeJson = (data) => fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');

// ------------------- CREATE USER -------------------
router.post('/create', (req, res) => {
    const { user_name, user_phone, imei1, imei2, doc_id, android_id, device_info, notes } = req.body;
    if (!user_name || !user_phone || !imei1 || !android_id) {
        return res.status(400).json({ success: false, message: "user_name, user_phone, imei1, android_id required" });
    }

    const users = readJson();
    const newUser = {
        userId: uuidv4(),
        user_name, user_phone,
        imei1, imei2: imei2 || '-',
        doc_id: doc_id || '-',
        android_id,
        device_info: device_info || {},
        notes: notes || '-',
        status: 'active',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJson(users);
    res.json({ success: true, message: "User created", user: newUser });
});

// ------------------- GET ALL USERS -------------------
router.get('/', (req, res) => {
    const users = readJson();
    res.json({ users });
});

// ------------------- UPDATE USER -------------------
router.post("/:id/update", (req,res)=>{
    const {id} = req.params;
    const {user_name,user_phone,imei1,imei2,status} = req.body; // status भी ले रहे हैं
    const users = JSON.parse(fs.readFileSync(USERS_FILE,"utf-8"));

    const index = users.findIndex(u=>u.userId===id);
    if(index===-1) return res.json({success:false,message:"User not found"});

    users[index] = {...users[index], user_name,user_phone,imei1,imei2,status};
    fs.writeFileSync(USERS_FILE,JSON.stringify(users,null,2));
    res.json({success:true,message:"User updated"});
});


// ------------------- DELETE USER -------------------
router.post('/:userId/delete', (req, res) => {
    const { userId } = req.params;
    let users = readJson();
    const initialLength = users.length;
    users = users.filter(u => u.userId !== userId);
    writeJson(users);
    const deleted = initialLength !== users.length;
    res.json({ success: deleted, message: deleted ? "User deleted" : "User not found" });
});

// ------------------- EXPORT USERS CSV -------------------
router.get('/export', (req, res) => {
    const users = readJson();
    let csvData = "userId,user_name,user_phone,imei1,imei2,doc_id,android_id,brand,model,android_version,battery,notes,status,createdAt\n";
    users.forEach(u => {
        const d = u.device_info || {};
        csvData += `${u.userId},${u.user_name},${u.user_phone},${u.imei1},${u.imei2},${u.doc_id},${u.android_id},${d.brand || '-'},${d.model || '-'},${d.android_version || '-'},${d.battery || '-'},${u.notes},${u.status},${u.createdAt}\n`;
    });
    res.header("Content-Type", "text/csv");
    res.attachment("users_backup.csv");
    res.send(csvData);
});

// ------------------- IMPORT USERS JSON / CSV -------------------
router.post('/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "File required" });

    const users = readJson();
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    if (ext === 'json') {
        try {
            const imported = JSON.parse(fs.readFileSync(req.file.path, 'utf-8'));
            imported.forEach(u => {
                u.userId = uuidv4();
                u.createdAt = new Date().toISOString();
                users.push(u);
            });
            writeJson(users);
            fs.unlinkSync(req.file.path);
            return res.json({ success: true, message: `${imported.length} users imported from JSON` });
        } catch (err) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: "Invalid JSON file", error: err.message });
        }
    } else if (ext === 'csv') {
        const results = [];
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                results.forEach(u => {
                    u.userId = uuidv4();
                    u.createdAt = new Date().toISOString();
                    u.user_name = u.user_name || "-";
                    u.user_phone = u.user_phone || "-";
                    u.imei1 = u.imei1 || "-";
                    u.android_id = u.android_id || "-";
                    u.device_info = u.device_info || {};
                    u.notes = u.notes || "-";
                    u.status = u.status || "active";
                    users.push(u);
                });
                writeJson(users);
                fs.unlinkSync(req.file.path);
                res.json({ success: true, message: `${results.length} users imported from CSV` });
            });
    } else {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Only JSON or CSV files are allowed" });
    }
});

module.exports = router;
