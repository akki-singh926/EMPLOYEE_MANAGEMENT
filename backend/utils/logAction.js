const Audit = require('../models/Audit');

async function logAction({ req, actor, action, targetType, targetId, details = {} }) {
  try {
    const ip = req?.headers['x-forwarded-for']?.split(',')[0].trim() || req?.ip || '';
    const userAgent = req?.headers['user-agent'] || '';

    await Audit.create({
      actorId: actor?._id || null,
      actorEmail: actor?.email || '',
      actorRole: actor?.role || '',
      action,
      targetType,
      targetId,
      details,
      ip,
      userAgent
    });
  } catch (err) {
    // non-fatal: log so server logs show the problem but do not break main flow
    console.error('Audit log error:', err);
  }
}

module.exports = logAction;
