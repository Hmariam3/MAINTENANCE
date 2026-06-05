const prisma = require('../db');

exports.getAssets = async (req, res) => {
  try {
    const assets = await prisma.assets.findMany({
      select: {
        asset_id: true,
        asset_number: true,
        tag_number: true,
        brand: true,
        model: true,
        current_status: true
      },
      orderBy: { created_at: 'desc' },
      take: 100
    });
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createAsset = async (req, res) => {
  const { 
    asset_number, tag_number, serial_number, company_name, description, 
    category_id, brand, model, cost_center_number, branch_id, district, 
    ip_address, acquisition_year, capitalized_on, current_status 
  } = req.body;

  try {
    const asset = await prisma.assets.create({
      data: {
        asset_number,
        tag_number,
        serial_number: serial_number || null,
        company_name: company_name || null,
        description: description || null,
        category_id: parseInt(category_id),
        brand: brand || null,
        model: model || null,
        cost_center_number: cost_center_number || null,
        branch_id: branch_id ? parseInt(branch_id) : null,
        district: district || null,
        ip_address: ip_address || null,
        acquisition_year: acquisition_year ? parseInt(acquisition_year) : null,
        capitalized_on: capitalized_on ? new Date(capitalized_on) : null,
        current_status: current_status || 'Active'
      }
    });
    res.status(201).json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating asset' });
  }
};
