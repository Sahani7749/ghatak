const fs = require('fs');
const path = require('path');

function readJson(filename){
    const filePath = path.join(__dirname, '..', 'data', filename);
    if(!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

function writeJson(filename, data){
    const filePath = path.join(__dirname, '..', 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readJson, writeJson };
