/**
 * LICK-4 — Google Sheets receiver
 *
 * Mirrors RELKIND/scripts/apps_script.gs, with one difference: LICK-4 writes
 * ONE ROW PER CHILD rather than one per trial. The game re-posts the same
 * (growing) wide row after every trial, so a session that drops out partway
 * still leaves its partial data behind. This script therefore UPDATES the
 * existing row for a participantId instead of appending a duplicate.
 *
 * Setup — paste this whole file into your Google Sheet:
 *   Extensions > Apps Script > replace the default code > Save.
 *
 * Then Deploy > New deployment:
 *   Type:           Web app
 *   Description:    LICK-4 data receiver
 *   Execute as:     Me (your account)
 *   Who has access: Anyone
 *
 * Copy the Web app URL and paste it into index.html as SHEETS_WEBHOOK.
 *
 * NOTE: after ANY edit to this file you must Deploy > Manage deployments >
 * edit the existing deployment > Version: New version. Saving alone does not
 * update the live URL.
 */

const SHEET_NAME = 'Data';   // tab to write into; created if missing
const KEY_COLUMN = 'participantId';

function doPost(e) {
  // Serialize concurrent submissions so two children finishing at the same
  // moment can't both read "lastRow" and write over each other.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    const data = JSON.parse(e.postData.contents);
    const incomingHeaders = data.headers || Object.keys(data.row || {});
    const row = data.row || {};

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(incomingHeaders);
      sheet.setFrozenRows(1);
    }

    // Use the sheet's own header order, in case column order ever drifts.
    const sheetHeaders = sheet
      .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
      .getValues()[0];

    // Any column the game sends that the sheet doesn't have yet gets appended
    // to the header row, so adding a measure later doesn't silently drop data.
    const missing = incomingHeaders.filter(function (h) {
      return h && sheetHeaders.indexOf(h) === -1;
    });
    if (missing.length) {
      sheet.getRange(1, sheetHeaders.length + 1, 1, missing.length)
           .setValues([missing]);
      Array.prototype.push.apply(sheetHeaders, missing);
    }

    const rowValues = sheetHeaders.map(function (h) {
      const v = row[h];
      return v === undefined || v === null ? '' : v;
    });

    // Upsert on participantId.
    const keyIdx = sheetHeaders.indexOf(KEY_COLUMN);
    const key = row[KEY_COLUMN];
    let targetRow = 0;

    if (keyIdx !== -1 && key) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const keys = sheet.getRange(2, keyIdx + 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < keys.length; i++) {
          if (String(keys[i][0]) === String(key)) { targetRow = i + 2; break; }
        }
      }
    }

    if (targetRow) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, row: targetRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

// Sanity check: visit the deployed URL in a browser to confirm it's reachable.
function doGet() {
  return ContentService
    .createTextOutput('LICK-4 receiver is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
