const PortfolioWork = require('../models/PortfolioWork');
const Joi = require('joi');

const getPortfolio = async (req, res) => {
  try {
    const works = await PortfolioWork.find({ companyId: req.user.companyId });
    works.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPortfolio = async (req, res) => {
  try {
    const schema = Joi.object({
      title: Joi.string().required(),
      titleAr: Joi.string().allow(''),
      description: Joi.string().allow(''),
      descriptionAr: Joi.string().allow(''),
      location: Joi.string().allow(''),
      completionDate: Joi.date(),
      category: Joi.string().allow(''),
      isFeatured: Joi.boolean().default(false)
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const images = req.files ? req.files.map(f => '/' + f.path.replace(/\\/g, '/')) : [];

    const work = await PortfolioWork.create({
      ...req.body,
      images,
      companyId: req.user.companyId
    });
    res.status(201).json(work);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPortfolio, createPortfolio };
