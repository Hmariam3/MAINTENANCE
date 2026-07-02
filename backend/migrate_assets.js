require('dotenv').config();
const prisma = require('./db');
const xlsx = require('xlsx');

async function main() {
  // === CONFIGURATION ===
  // CHANGE THIS TO THE ACTUAL PATH OF YOUR EXCEL FILE
  const excelFilePath = 'assets.xlsx'; 
  // =====================

  console.log(`Reading Excel file from ${excelFilePath}...`);
  try {
    // cellDates: true parses excel dates as JS Date objects automatically
    const workbook = xlsx.readFile(excelFilePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0]; 
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} records. Starting migration...`);

    let successCount = 0;
    for (const row of data) {
      // Normalize row keys by removing ALL spaces and lowercasing
      const normalizedRow = {};
      for (const key in row) {
        const cleanKey = key.replace(/\s+/g, '').toLowerCase();
        normalizedRow[cleanKey] = row[key];
      }

      try {
        // Parse category_id
        const categoryId = parseInt(normalizedRow['categoryid(required)'], 10);
        if (isNaN(categoryId)) {
          console.warn(`Skipping record with invalid/missing category ID for asset: ${normalizedRow['assetnumber']}`);
          continue;
        }

        // Map status enum safely
        let currentStatus = 'Active'; // Default
        const rawStatus = String(normalizedRow['currentstatus'] || '').trim().toLowerCase();
        if (rawStatus === 'active') currentStatus = 'Active';
        else if (rawStatus === 'under maintenance') currentStatus = 'Under_Maintenance';
        else if (rawStatus === 'disposed') currentStatus = 'Disposed';
        else if (rawStatus === 'replaced') currentStatus = 'Replaced';

        const assetNumber = String(normalizedRow['assetnumber'] || '');
        if (!assetNumber) {
          console.warn('Skipping record with missing asset number');
          continue;
        }

        const dataPayload = {
          tag_number: String(normalizedRow['tagnumber(required)'] || ''),
          serial_number: normalizedRow['serialnumber'] ? String(normalizedRow['serialnumber']) : null,
          company_name: normalizedRow['companyname'] ? String(normalizedRow['companyname']) : null,
          description: normalizedRow['description'] ? String(normalizedRow['description']) : null,
          category_id: categoryId,
          brand: normalizedRow['brand'] ? String(normalizedRow['brand']) : null,
          model: normalizedRow['model'] ? String(normalizedRow['model']) : null,
          cost_center_number: normalizedRow['costcenter'] ? String(normalizedRow['costcenter']) : null,
          branch_id: normalizedRow['branchid'] ? parseInt(normalizedRow['branchid'], 10) : null,
          district: normalizedRow['district(subprocess)'] ? String(normalizedRow['district(subprocess)']) : null,
          acquisition_year: normalizedRow['acquisitionyear'] ? parseInt(normalizedRow['acquisitionyear'], 10) : null,
          capitalized_on: normalizedRow['capitalizedon'] ? new Date(normalizedRow['capitalizedon']) : null,
          current_status: currentStatus,
          ip_address: normalizedRow['ipaddress'] ? String(normalizedRow['ipaddress']) : null,
        };

        await prisma.assets.upsert({
          where: { asset_number: assetNumber },
          update: dataPayload,
          create: {
            asset_number: assetNumber,
            ...dataPayload
          }
        });
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Successfully migrated ${successCount} records...`);
        }
      } catch (err) {
        console.error(`Failed to migrate record: ${normalizedRow['asset number']}`);
        console.error(err.message);
      }
    }
    
    console.log(`Migration completed successfully! Inserted ${successCount} out of ${data.length} records.`);
  } catch (error) {
    console.error(`Error reading Excel file: ${error.message}`);
    console.log('Please make sure you have the correct file path.');
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
