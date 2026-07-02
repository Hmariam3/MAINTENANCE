const prisma = require('../db');

exports.getAssets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      branch = '', 
      cost_center = '',
      export: isExport = false
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Build the dynamic 'where' clause
    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { asset_number: { contains: search, mode: 'insensitive' } },
        { tag_number: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      whereClause.category_id = parseInt(category);
    }

    if (branch) {
      whereClause.branch_id = parseInt(branch);
    }

    if (cost_center) {
      whereClause.cost_center_number = { contains: cost_center, mode: 'insensitive' };
    }

    // Query configuration
    const queryConfig = {
      where: whereClause,
      include: {
        branches: { select: { branch_name: true, branch_code: true } },
        asset_categories: { select: { category_name: true } }
      },
      orderBy: { created_at: 'desc' },
    };

    if (isExport === 'true' || isExport === true) {
      // If exporting, ignore skip/take to fetch all matching records
      const assets = await prisma.assets.findMany(queryConfig);
      return res.json({ data: assets });
    } else {
      // Standard paginated fetch
      queryConfig.skip = (pageNumber - 1) * limitNumber;
      queryConfig.take = limitNumber;

      const [assets, total] = await Promise.all([
        prisma.assets.findMany(queryConfig),
        prisma.assets.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(total / limitNumber);

      return res.json({
        data: assets,
        total,
        page: pageNumber,
        totalPages
      });
    }
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
