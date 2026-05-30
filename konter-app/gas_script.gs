function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Check if it's the first time and write headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Transaction ID",
        "Ref ID",
        "Mitra Name",
        "Product",
        "Category",
        "Customer No",
        "Harga Modal",
        "Harga Jual",
        "Profit",
        "Status",
        "SN"
      ]);
      
      // Format header
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#f3f4f6");
    }
    
    // Append the data
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.transaction_id || "",
      data.ref_id || "",
      data.mitra_name || "",
      data.product_name || "",
      data.category || "",
      data.customer_no || "",
      data.harga_modal || 0,
      data.harga_jual || 0,
      data.profit || 0,
      data.status || "",
      data.sn || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
