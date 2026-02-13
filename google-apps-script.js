
/**
 * Google Apps Script for Ginza Industries Dispatch Tracker
 * VERSION: 9.0 (Strict ID Priority Upsert)
 */

const SHEET_ID = "1j7zhkwKZYAufxkwsEUBHnauqMowQ_IPaQT5sVYFpT2w";
const UNITS = [
  "KNITTING DISPATCH CURCULAR",
  "CROCHET",
  "DAMAN ELASTIC",
  "DIGITAL PRINTING FABRIC",
  "DIGITAL PRINTING UNIT",
  "EMBROIDERY",
  "EYE HOOK UNIT",
  "HEKTOR",
  "MOLDING",
  "SACHIN KNITTING",
  "SUNSILK",
  "TAPE DYEING",
  "TORCHAN LACE",
  "UDHNA",
  "VALUE ADDITION",
  "WARP WEFT FABRICS"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const tz = ss.getSpreadsheetTimeZone();
    
    let data;
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      } else {
        data = JSON.parse(e.parameter.payload);
      }
    } catch (parseErr) {
      return ContentService.createTextOutput("JSON Parse Fail").setMimeType(ContentService.MimeType.TEXT);
    }

    const rows = sheet.getDataRange().getValues();
    let rowIndex = -1;
    const incomingId = data.id ? data.id.toString() : "";
    const incomingDateStr = data.date ? data.date.toString() : ""; 

    // 1. SEARCH FOR ROW
    for (let i = 0; i < rows.length; i++) {
      // Primary Search: Match by ID
      if (incomingId && rows[i][0] && rows[i][0].toString() === incomingId) {
        rowIndex = i;
        break;
      }
      
      // Secondary Search: Match by Date (Fallback for safety)
      if (incomingDateStr) {
        let cellValue = rows[i][1];
        let sheetDateStr = "";
        
        if (cellValue instanceof Date) {
          sheetDateStr = Utilities.formatDate(cellValue, tz, "yyyy-MM-dd");
        } else if (cellValue) {
          try {
            sheetDateStr = Utilities.formatDate(new Date(cellValue), tz, "yyyy-MM-dd");
          } catch(e) {
            sheetDateStr = cellValue.toString();
          }
        }
        
        if (sheetDateStr === incomingDateStr) {
          rowIndex = i;
          break;
        }
      }
    }

    // 2. CONSTRUCT ROW PAYLOAD
    const row = [incomingId || "N/A", data.date || "N/A"];
    UNITS.forEach(function(u) {
      const unitInfo = (data.units && (data.units[u] || data.units['KNITTING DISPATCH CIRCULAR'])) 
                        ? (data.units[u] || data.units['KNITTING DISPATCH CIRCULAR']) 
                        : { orderValue: 0, dispatchValue: 0 };
      row.push(parseFloat(unitInfo.orderValue) || 0);
      row.push(parseFloat(unitInfo.dispatchValue) || 0);
    });
    row.push(parseFloat(data.totalOrder) || 0);
    row.push(parseFloat(data.totalDispatch) || 0);

    // 3. APPLY UPSERT
    if (rowIndex !== -1) {
      sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
      return ContentService.createTextOutput("SUCCESS: Record Updated").setMimeType(ContentService.MimeType.TEXT);
    } else {
      sheet.appendRow(row);
      return ContentService.createTextOutput("SUCCESS: Record Created").setMimeType(ContentService.MimeType.TEXT);
    }
      
  } catch (error) {
    return ContentService.createTextOutput("CRITICAL ERROR: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const tz = ss.getSpreadsheetTimeZone();
    const range = sheet.getDataRange();
    if (range.getLastRow() < 1) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    
    const rows = range.getValues();
    const resultData = [];
    
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || r[0].toString().toLowerCase().includes("id") || r[0] === "N/A") continue;
      
      try {
        let dateVal = r[1];
        if (dateVal instanceof Date) { 
          dateVal = Utilities.formatDate(dateVal, tz, "yyyy-MM-dd"); 
        } else { 
          dateVal = dateVal.toString(); 
        }

        const payload = {
          id: r[0].toString(),
          date: dateVal,
          units: {},
          totalOrder: 0,
          totalDispatch: 0
        };
        
        let col = 2;
        UNITS.forEach(u => {
          const o = parseFloat(r[col]) || 0;
          const d = parseFloat(r[col+1]) || 0;
          payload.units[u] = { orderValue: o, dispatchValue: d };
          col += 2;
        });
        payload.totalOrder = parseFloat(r[col]) || 0;
        payload.totalDispatch = parseFloat(r[col+1]) || 0;
        resultData.push(payload);
      } catch (rowErr) {}
    }
    return ContentService.createTextOutput(JSON.stringify(resultData)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
