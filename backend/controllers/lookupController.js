const prisma = require('../db');
const { ROLES } = require('../constants/roles');

exports.getLookups = async (req, res) => {
  try {
    const [
      categories, branches, priorities, users,
      assets, subProcessess, technicians,
      holdReasons, partyTypes, roles
    ] = await Promise.all([
      prisma.asset_categories.findMany({ where: { is_active: true } }),
      prisma.branches.findMany({ where: { is_active: true } }),
      prisma.priority_levels.findMany(),
      prisma.users.findMany({
        where: { is_active: true },
        select: { user_id: true, full_name: true, email: true, role_id: true }
      }),
      prisma.assets.findMany({
        select: {
          asset_id: true, asset_number: true, tag_number: true,
          brand: true, model: true, serial_number: true,
          ip_address: true, branch_id: true, category_id: true
        }
      }),
      prisma.sub_processess.findMany({ select: { id: true, process_name: true } }),
      // Technicians only — for assignment dropdown
      prisma.users.findMany({
        where: { is_active: true, role_id: ROLES.TECHNICIAN },
        select: { user_id: true, full_name: true, email: true }
      }),
      // On Hold reasons
      prisma.on_hold_reasons.findMany({ orderBy: { reason_id: 'asc' } }),
      // Responsible party types
      prisma.responsible_party_types.findMany({ orderBy: { party_type_id: 'asc' } }),
      // Roles
      prisma.roles.findMany({ orderBy: { role_id: 'asc' } }),
    ]);

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
      sub_processess: formattedSubProcessess,
      technicians,
      hold_reasons: holdReasons,
      party_types:  partyTypes,
      roles:        roles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching lookups' });
  }
};
