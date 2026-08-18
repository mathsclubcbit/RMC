const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

async function run() {
    const filePath = "d:\\RMC\\main\\public\\assets\\events\\questions\\drive-download-20260818T171839Z-1-001\\1\\APPTRONIX_QUIZ_AUG26.docx";
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value;
        console.log("=== BEGIN TEXT ===");
        console.log(text.substring(0, 2000)); // Print first 2000 chars
        console.log("=== END TEXT ===");
    } catch (err) {
        console.error(err);
    }
}

run();
