const prisma = require('../db');

exports.getLookups = async (req, res) => {
  try {
    const [categories, branches, priorities, users, assets, subProcessess] = await Promise.all([
      prisma.asset_categories.findMany({ where: { is_active: true } }),
      prisma.branches.findMany({ where: { is_active: true } }),
      prisma.priority_levels.findMany(),
      prisma.users.findMany({
        where: { is_active: true },
        select: { user_id: true, full_name: true, email: true }
      }),
      prisma.assets.findMany({
        select: { asset_id: true, asset_number: true, tag_number: true, brand: true, model: true, branch_id: true, category_id: true }
      }),
      prisma.sub_processess.findMany({
        select: { id: true, process_name: true }
      })
    ]);

    // Convert BigInt to string for JSON serialization
    const formattedSubProcessess = subProcessess.map(sp => ({
      id: sp.id.toString(),
      process_name: sp.process_name
    }));

    res.json({
      categories,
      branches,
      priorities,
      users,
      assets,
      sub_processess: formattedSubProcessess
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching lookups' });
  }
};
