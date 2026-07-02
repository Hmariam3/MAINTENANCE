require('dotenv').config();
const prisma = require('./db');
const xlsx = require('xlsx');

async function main() {
  // === CONFIGURATION ===
  // CHANGE THIS TO THE ACTUAL PATH OF YOUR EXCEL FILE
  // You can use relative paths like './data.xlsx' or absolute paths like 'C:/path/to/data.xlsx'
  const excelFilePath = 'data.xlsx'; 
  // =====================

  console.log(`Reading Excel file from ${excelFilePath}...`);
  try {
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Assuming first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} records. Cleaning up old data and starting migration...`);

    // Clear existing data so we don't get duplicates
    await prisma.cost_centers.deleteMany({});
    console.log('Old data cleared.');

    let successCount = 0;
    for (const row of data) {
      // Normalize row keys to handle potential trailing spaces or different casing in Excel
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }

      try {
        await prisma.cost_centers.create({
          data: {
            company_code: String(normalizedRow['company code'] || ''),
            cost_center: String(normalizedRow['cost center'] || ''),
            branch: String(normalizedRow['branch'] || ''),
            district: String(normalizedRow['district'] || ''),
          }
        });
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Successfully migrated ${successCount} records...`);
        }
      } catch (err) {
        console.error(`Failed to migrate record: ${JSON.stringify(row)}`);
        console.error(err.message);
      }
    }
    
    console.log(`Migration completed successfully! Inserted ${successCount} out of ${data.length} records.`);
  } catch (error) {
    console.error(`Error reading Excel file: ${error.message}`);
    console.log('Please make sure you have the correct file path and the "xlsx" library is installed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
