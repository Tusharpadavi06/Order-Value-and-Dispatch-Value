
/**
 * Google Apps Script for Ginza Industries Dispatch Tracker
 * VERSION: 9.0 (Strict ID Priority Upsert)
 */

const SHEET_ID = "1j7zhkwKZYAufxkwsEUBHnauqMowQ_IPaQT5sVYFpT2w";
const UNITS = [
  "CURCULAR KNITTING UNIT",
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
  "WARP WEFT FABRICS",
  "APPAREL PARK",
  "AMBERNATH LINGERIES UNIT",
  "SOIE",
  "SACHIN GARMENT",
  "GINZA LIFE STYLE"
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

    // 1. SEARCH FOR ROW BY ID OR DATE
    const normalizedIncomingDate = normalizeDate(incomingDateStr);

    for (let i = 0; i < rows.length; i++) {
      // Match by ID (Column A)
      if (incomingId && rows[i][0] && rows[i][0].toString() === incomingId) {
        rowIndex = i;
        break;
      }
      
      // Fallback: Match by Date (Column B)
      if (normalizedIncomingDate) {
        let cellValue = rows[i][1]; 
        let normalizedSheetDate = normalizeDate(cellValue);
        
        if (normalizedSheetDate === normalizedIncomingDate) {
          rowIndex = i;
          break;
        }
      }
    }

    // Helper to normalize dates to YYYY-MM-DD string
    function normalizeDate(dateVal) {
      if (!dateVal || dateVal === "N/A") return "";
      try {
        let d;
        if (dateVal instanceof Date) {
          // Use local components to avoid timezone shifts
          return dateVal.getFullYear() + "-" + 
                 ("0" + (dateVal.getMonth() + 1)).slice(-2) + "-" + 
                 ("0" + dateVal.getDate()).slice(-2);
        } else {
          // Handle string dates
          const dateStr = dateVal.toString().trim();
          // Try standard parsing
          d = new Date(dateStr);
          
          // If standard parsing fails or gives weird results, try manual split
          if (isNaN(d.getTime())) {
            const parts = dateStr.split(/[-/.\s]/);
            if (parts.length === 3) {
              // Assume YYYY-MM-DD or DD-MM-YYYY
              if (parts[0].length === 4) {
                return parts[0] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[2]).slice(-2);
              } else if (parts[2].length === 4) {
                return parts[2] + "-" + ("0" + parts[1]).slice(-2) + "-" + ("0" + parts[0]).slice(-2);
              }
            }
          }
        }
        
        if (!isNaN(d.getTime())) {
          // For parsed dates, use local components as well
          return d.getFullYear() + "-" + 
                 ("0" + (d.getMonth() + 1)).slice(-2) + "-" + 
                 ("0" + d.getDate()).slice(-2);
        }
      } catch (e) {}
      return dateVal ? dateVal.toString().trim() : "";
    }

    // 2. CONSTRUCT DATA ROW (Starting from Column B: Date + 16 Units * 2)
    const dataRow = [data.date || "N/A"]; // Column B
    UNITS.forEach(function(u) {
      const unitInfo = (data.units && data.units[u]) 
                        ? data.units[u] 
                        : { orderValue: 0, dispatchValue: 0 };
      dataRow.push(parseFloat(unitInfo.orderValue) || 0);
      dataRow.push(parseFloat(unitInfo.dispatchValue) || 0);
    });

    // 3. APPLY UPSERT
    if (rowIndex !== -1) {
      // Update Column B onwards (leave Column A/ID as is)
      sheet.getRange(rowIndex + 1, 2, 1, dataRow.length).setValues([dataRow]);
      return ContentService.createTextOutput("SUCCESS: Record Updated").setMimeType(ContentService.MimeType.TEXT);
    } else {
      // New Record: Write ID to A, and dataRow to B onwards
      const finalRow = [incomingId || "NEW"].concat(dataRow);
      sheet.appendRow(finalRow);
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
      // Skip header or empty rows (Check Column B for Date)
      if (!r[1] || r[1].toString().toLowerCase().includes("date") || r[1] === "N/A") continue;
      
      try {
        let dateVal = r[1]; // Date is in Column B
        if (dateVal instanceof Date) { 
          dateVal = Utilities.formatDate(dateVal, tz, "yyyy-MM-dd"); 
        } else { 
          dateVal = dateVal.toString(); 
        }

        const payload = {
          id: r[0] ? r[0].toString() : dateVal, // ID is in Column A
          date: dateVal,
          units: {},
          totalOrder: 0,
          totalDispatch: 0
        };
        
        let col = 2; // Units start at Column C (index 2)
        UNITS.forEach(u => {
          const o = parseFloat(r[col]) || 0;
          const d = parseFloat(r[col+1]) || 0;
          payload.units[u] = { orderValue: o, dispatchValue: d };
          payload.totalOrder += o;
          payload.totalDispatch += d;
          col += 2;
        });
        resultData.push(payload);
      } catch (rowErr) {}
    }
    return ContentService.createTextOutput(JSON.stringify(resultData)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
