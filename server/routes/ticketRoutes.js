const express = require('express');
const db = require('../../shared/database');

const router = express.Router();

// ─── Ticket System Routes ─────────────────────────────────────────────────────
router.get('/:guildId/tickets/config', (req, res) => {
    try { 
        res.json(db.getTicketConfig(req.params.guildId)); 
    } catch (err) { 
        res.status(500).json({ error: 'Failed to fetch ticket config' }); 
    }
});

router.post('/:guildId/tickets/config', (req, res) => {
    try {
        db.updateTicketConfig(req.params.guildId, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save ticket config' });
    }
});

router.post('/:guildId/tickets/setup-panel', (req, res) => {
    db.addAction(req.params.guildId, 'SETUP_TICKET_PANEL', {});
    res.json({ success: true });
});

router.get('/:guildId/tickets', (req, res) => {
    try {
        res.json(db.getTickets(req.params.guildId));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

module.exports = router;
