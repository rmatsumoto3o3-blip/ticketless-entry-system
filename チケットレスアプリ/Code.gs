/**
 * Ticketless Entry System - Backend Logic
 */

const SHEET_NAME = "Attendees";
const QR_API_URL = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=";

/**
 * Serves the Web App (QR Scanner)
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Ticketless Check-in')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Generates tokens and sends emails to attendees
 * Run this function manually from the GAS editor.
 */
function sendTicketEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupSheet(); // Create sheet if it doesn't exist
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  // Headers: ID, Name, Email, Token, Status, Sent
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = row[2];
    let token = row[3];
    const isSent = row[5];
    
    if (email && !isSent) {
      // Generate Token if missing
      if (!token) {
        token = Utilities.getUuid();
        sheet.getRange(i + 1, 4).setValue(token);
      }
      
      // Generate QR Code URL and Blob
      const qrUrl = QR_API_URL + encodeURIComponent(token);
      let qrBlob;
      try {
        qrBlob = UrlFetchApp.fetch(qrUrl).getBlob().setName("qrcode.png");
      } catch (e) {
        Logger.log("Error fetching QR code: " + e);
        // Fallback if fetch fails (though unlikely with public API)
        continue; 
      }

      const subject = "【チケット】イベント入場用QRコード";
      const textBody = `
        ${row[1]} 様
        
        イベントにお申し込みありがとうございます。
        当日は以下のQRコードを受付で提示してください。
        
        QR Code URL: ${qrUrl}
        
        Token: ${token}
      `;
      
      const htmlBody = `
        <p>${row[1]} 様</p>
        <p>イベントにお申し込みありがとうございます。<br>
        当日は以下のQRコードを受付で提示してください。</p>
        <p><img src="cid:qrcode" alt="QR Code" width="150" height="150" /></p>
        <p>※画像が表示されない場合は<a href="${qrUrl}">こちら</a>をクリックしてください。</p>
        <hr>
        <p><small>Token: ${token}</small></p>
      `;
      
      GmailApp.sendEmail(email, subject, textBody, { 
        htmlBody: htmlBody,
        inlineImages: {
          qrcode: qrBlob
        }
      });
      
      // Mark as Sent
      sheet.getRange(i + 1, 6).setValue(true);
    }
  }
}

/**
 * API called by the frontend to check in a user
 */
function checkInUser(token) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === token) {
      // Found the user
      const currentStatus = data[i][4];
      
      if (currentStatus === "Checked-in") {
        return { success: false, message: "既にチェックイン済みです (Checked-in at " + data[i][6] + ")" };
      } else {
        // Update status
        const now = new Date();
        sheet.getRange(i + 1, 5).setValue("Checked-in"); // Status
        sheet.getRange(i + 1, 7).setValue(now); // CheckInTime (Col G)
        return { success: true, message: "チェックイン完了: " + data[i][1] + " 様" };
      }
    }
  }
  
  return { success: false, message: "無効なQRコードです" };
}

/**
 * Helper to setup the sheet structure
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["ID", "Name", "Email", "Token", "Status", "EmailSent", "CheckInTime"]);
  }
}
