const Notification = require('../models/Notification.model');

/** GET /api/notifications — list for logged-in user */
exports.getAll = async (req, res) => {
  try {
    const { unreadOnly, page = 1, limit = 30 } = req.query;
    const filter = { user: req.user._id };
    if (unreadOnly === 'true') filter.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** PATCH /api/notifications/:id/read — mark single notification read */
exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json({ notification: n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** PATCH /api/notifications/read-all — mark all as read */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** DELETE /api/notifications/:id */
exports.remove = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};