import express from 'express';
import EmailCampaign from '../models/EmailCampaign.js';
import Client from '../models/Client.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configuration email (à mettre dans .env)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Récupérer toutes les campagnes
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une campagne
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('recipients', 'name email')
      .populate('createdBy', 'firstName lastName email');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une campagne
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, subject, content, recipients, recipientType } = req.body;

    let recipientIds = [];
    if (recipientType === 'all') {
      const allClients = await Client.find({ isActive: true, email: { $exists: true, $ne: '' } });
      recipientIds = allClients.map(c => c._id);
    } else if (recipientType === 'selected' && recipients) {
      recipientIds = recipients;
    }

    const campaign = new EmailCampaign({
      name,
      subject,
      content,
      recipients: recipientIds,
      recipientType,
      createdBy: req.user._id
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Modifier une campagne
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Impossible de modifier une campagne déjà envoyée' });
    }

    const { name, subject, content, recipients, recipientType } = req.body;

    if (name) campaign.name = name;
    if (subject) campaign.subject = subject;
    if (content) campaign.content = content;
    if (recipientType) {
      campaign.recipientType = recipientType;
      if (recipientType === 'all') {
        const allClients = await Client.find({ isActive: true, email: { $exists: true, $ne: '' } });
        campaign.recipients = allClients.map(c => c._id);
      } else if (recipientType === 'selected' && recipients) {
        campaign.recipients = recipients;
      }
    } else if (recipients) {
      campaign.recipients = recipients;
    }

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Envoyer une campagne
router.post('/:id/send', authenticate, requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('recipients');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campagne déjà envoyée' });
    }

    campaign.status = 'sending';
    await campaign.save();

    // Envoyer les emails (en arrière-plan)
    sendCampaignEmails(campaign).catch(console.error);

    res.json({ message: 'Envoi de la campagne démarré', campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fonction pour envoyer les emails
async function sendCampaignEmails(campaign) {
  const transporter = createTransporter();
  let sentCount = 0;
  let failedCount = 0;

  for (const client of campaign.recipients) {
    if (!client.email) continue;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: client.email,
        subject: campaign.subject,
        html: campaign.content.replace(/\{name\}/g, client.name || 'Client')
      });
      sentCount++;
    } catch (error) {
      console.error(`Erreur envoi email à ${client.email}:`, error);
      failedCount++;
    }
  }

  campaign.status = 'sent';
  campaign.sentAt = new Date();
  campaign.sentCount = sentCount;
  campaign.failedCount = failedCount;
  await campaign.save();
}

// Supprimer une campagne
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    res.json({ message: 'Campagne supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;




