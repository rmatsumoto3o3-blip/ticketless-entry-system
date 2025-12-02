/**
 * Ticketless Entry System - GAS Backend
 * 
 * This script handles:
 * - QR code generation and email distribution
 * - Check-in validation and recording
 * - Dashboard statistics
 * 
 * Database: Google Sheets "Attendees" sheet
 * Columns: ID | Name | Email | Token | CheckInTime | EmailSent
 */

// ==================== CONFIGURATION ====================

const SHEET_NAME = 'Attendees';
const QR_CODE_SIZE = 300;
const QR_API_BASE = 'https://chart.googleapis.com/chart';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get the Attendees sheet
 */
function getAttendeesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    // Create sheet if it doesn't exist
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Name', 'Email', 'Token', 'CheckInTime', 'EmailSent']);
    sheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  return sheet;
}

/**
 * Generate SHA-256 hash
 */
function generateHash(input) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  
  return rawHash.map(byte => {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

/**
 * Generate unique token for an attendee
 */
function generateToken(id, rowNumber) {
  const timestamp = new Date().getTime();
  const input = `${id}_${rowNumber}_${timestamp}`;
  return generateHash(input);
}

/**
 * Generate QR code URL
 */
function getQRCodeUrl(token) {
  return `${QR_API_BASE}?cht=qr&chs=${QR_CODE_SIZE}x${QR_CODE_SIZE}&chl=${encodeURIComponent(token)}`;
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Send tickets to all attendees who haven't received them yet
 * Run this manually from the Apps Script editor
 */
function sendTickets() {
  const sheet = getAttendeesSheet();
  const data = sheet.getDataRange().getValues();
  
  let sentCount = 0;
  let errorCount = 0;
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = row[0];
    const name = row[1];
    const email = row[2];
    let token = row[3];
    const emailSent = row[5];
    
    // Skip if already sent
    if (emailSent === true || emailSent === 'TRUE') {
      continue;
    }
    
    // Skip if missing required data
    if (!id || !name || !email) {
      Logger.log(`Row ${i + 1}: Missing required data`);
      errorCount++;
      continue;
    }
    
    try {
      // Generate token if not exists
      if (!token) {
        token = generateToken(id, i + 1);
        sheet.getRange(i + 1, 4).setValue(token);
      }
      
      // Generate QR code URL (using api.qrserver.com as it's more reliable)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_CODE_SIZE}x${QR_CODE_SIZE}&data=${encodeURIComponent(token)}`;
      
      // Fetch the QR code image as a blob
      let qrBlob;
      try {
        const response = UrlFetchApp.fetch(qrUrl);
        qrBlob = response.getBlob().setName("qrcode.png");
      } catch (e) {
        Logger.log(`Error fetching QR code for ${email}: ${e.message}`);
        errorCount++;
        continue;
      }
      
      // Send email with inline image
      const subject = 'イベント入場チケット / Event Entry Ticket';
      const htmlBody = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4285f4;">イベント入場チケット</h2>
            <p>こんにちは、${name}様</p>
            <p>イベントへのご参加ありがとうございます。以下のQRコードが入場チケットとなります。</p>
            <p>当日、受付でこのQRコードをご提示ください。</p>
            <div style="text-align: center; margin: 30px 0;">
              <img src="cid:qrcode" alt="QR Code" style="border: 2px solid #ddd; padding: 10px; width: 200px; height: 200px;" />
            </div>
            <p style="color: #666; font-size: 12px;">
              会員ID: ${id}<br>
              このメールは大切に保管してください。
            </p>
            <div style="margin-top: 20px; font-size: 11px; color: #999;">
              <p>※画像が表示されない場合は、以下のリンクから確認してください:<br>
              <a href="${qrUrl}">${qrUrl}</a></p>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            <h3 style="color: #4285f4;">Event Entry Ticket</h3>
            <p>Hello ${name},</p>
            <p>Thank you for registering. Please present this QR code at the reception desk.</p>
            <p style="color: #666; font-size: 12px;">
              Member ID: ${id}<br>
              Please keep this email safe.
            </p>
          </body>
        </html>
      `;
      
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: htmlBody,
        inlineImages: {
          qrcode: qrBlob
        }
      });
      
      // Mark as sent
      sheet.getRange(i + 1, 6).setValue(true);
      sentCount++;
      
      Logger.log(`Sent ticket to ${email}`);
      
      // Avoid hitting quotas
      Utilities.sleep(500);
      
    } catch (error) {
      Logger.log(`Error sending to ${email}: ${error.message}`);
      errorCount++;
    }
  }
  
  Logger.log(`\n=== SUMMARY ===`);
  Logger.log(`Sent: ${sentCount}`);
  Logger.log(`Errors: ${errorCount}`);
  
  return {
    sent: sentCount,
    errors: errorCount
  };
}

/**
 * Check in a user by token
 */
function checkInUser(token) {
  if (!token) {
    return {
      success: false,
      message: 'トークンが指定されていません / Token not provided'
    };
  }
  
  const sheet = getAttendeesSheet();
  const data = sheet.getDataRange().getValues();
  
  // Find the attendee by token
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const storedToken = row[3];
    const checkInTime = row[4];
    const name = row[1];
    const id = row[0];
    
    if (storedToken === token) {
      // Check if already checked in
      if (checkInTime) {
        return {
          success: false,
          status: 'WARNING',
          message: `既に入場済みです / Already checked in`,
          name: name,
          id: id,
          checkInTime: Utilities.formatDate(new Date(checkInTime), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
        };
      }
      
      // Record check-in time
      const now = new Date();
      sheet.getRange(i + 1, 5).setValue(now);
      
      return {
        success: true,
        status: 'SUCCESS',
        message: '入場を受け付けました / Check-in successful',
        name: name,
        id: id,
        checkInTime: Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
      };
    }
  }
  
  // Token not found
  return {
    success: false,
    status: 'ERROR',
    message: '無効なチケットです / Invalid ticket'
  };
}

/**
 * Get dashboard statistics
 */
function getDashboardData() {
  const sheet = getAttendeesSheet();
  const data = sheet.getDataRange().getValues();
  
  let total = 0;
  let checkedIn = 0;
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = row[0];
    const checkInTime = row[4];
    
    // Only count rows with valid ID
    if (id) {
      total++;
      if (checkInTime) {
        checkedIn++;
      }
    }
  }
  
  return {
    total: total,
    checkedIn: checkedIn,
    notCheckedIn: total - checkedIn
  };
}

/**
 * Manual check-in by ID
 */
function manualCheckIn(memberId) {
  if (!memberId) {
    return {
      success: false,
      message: '会員IDが指定されていません / Member ID not provided'
    };
  }
  
  const sheet = getAttendeesSheet();
  const data = sheet.getDataRange().getValues();
  
  // Find the attendee by ID
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = row[0];
    const checkInTime = row[4];
    const name = row[1];
    
    if (id.toString() === memberId.toString()) {
      // Check if already checked in
      if (checkInTime) {
        return {
          success: false,
          status: 'WARNING',
          message: `既に入場済みです / Already checked in`,
          name: name,
          id: id,
          checkInTime: Utilities.formatDate(new Date(checkInTime), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
        };
      }
      
      // Record check-in time
      const now = new Date();
      sheet.getRange(i + 1, 5).setValue(now);
      
      return {
        success: true,
        status: 'SUCCESS',
        message: '入場を受け付けました / Check-in successful',
        name: name,
        id: id,
        checkInTime: Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
      };
    }
  }
  
  // ID not found
  return {
    success: false,
    status: 'ERROR',
    message: '会員IDが見つかりません / Member ID not found'
  };
}

// ==================== WEB APP ENDPOINTS ====================

/**
 * Handle GET requests (API endpoints for Next.js)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  let result;
  
  try {
    switch (action) {
      case 'checkIn':
        result = checkInUser(e.parameter.token);
        break;
        
      case 'manualCheckIn':
        result = manualCheckIn(e.parameter.memberId);
        break;
        
      case 'dashboard':
        result = getDashboardData();
        break;
        
      default:
        result = {
          success: false,
          message: 'Invalid action'
        };
    }
  } catch (error) {
    result = {
      success: false,
      message: error.message
    };
  }
  
  // Return JSON response with CORS headers
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests (same as GET for simplicity)
 */
function doPost(e) {
  return doGet(e);
}
