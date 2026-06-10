// Role IDs — matches the `roles` table in DB
const ROLES = {
  REQUESTER:   1,
  SUPERVISOR:  2,
  HELPDESK:    3,
  TECHNICIAN:  4,
  MANAGER:     5,
  PROCUREMENT: 6,
  STORE:       7,
  DIRECTOR:    8,
};

// Status IDs — matches the `request_statuses` table in DB
const STATUS = {
  OPEN:        1,
  ASSIGNED:    2,
  IN_PROGRESS: 3,
  ON_HOLD:     4,
  COMPLETED:   5,
  DISPOSAL:    6,
};

// Statuses the /status endpoint accepts (On Hold and Disposal have dedicated endpoints)
const STATUS_UPDATE_ALLOWED = [STATUS.IN_PROGRESS, STATUS.COMPLETED];

// Category ID → detail table type
// Solar (4) shares the Electrical table
const CATEGORY_DETAIL_TYPE = {
  1: 'hardware',
  2: 'generator',
  3: 'electrical',
  4: 'electrical',
};

module.exports = { ROLES, STATUS, STATUS_UPDATE_ALLOWED, CATEGORY_DETAIL_TYPE };
