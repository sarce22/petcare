import { Router } from 'express';
import mongoose from 'mongoose';
import Pet from '../models/pet.js';
import * as logger from '../utils/logger.js';

const router = Router();

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidOwner(owner) {
  if (owner == null) {
    return true;
  }

  if (typeof owner !== 'object' || Array.isArray(owner)) {
    return false;
  }

  const { name, contact, ...rest } = owner;

  if (Object.keys(rest).length > 0) {
    return false;
  }

  const hasName = name == null || isNonEmptyString(name);
  const hasContact = contact == null || isNonEmptyString(contact);

  return hasName && hasContact;
}

function validatePetPayload(payload, { partial = false } = {}) {
  const errors = [];
  const allowedKeys = new Set(['name', 'species', 'breed', 'age', 'owner']);
  const unexpectedKeys = Object.keys(payload).filter((key) => !allowedKeys.has(key));

  if (unexpectedKeys.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedKeys.join(', ')}`);
  }

  if (!partial || payload.name !== undefined) {
    if (!isNonEmptyString(payload.name)) {
      errors.push('Field "name" must be a non-empty string.');
    }
  }

  if (!partial || payload.species !== undefined) {
    if (!isNonEmptyString(payload.species)) {
      errors.push('Field "species" must be a non-empty string.');
    }
  }

  if (payload.breed !== undefined && !isNonEmptyString(payload.breed)) {
    errors.push('Field "breed" must be a non-empty string when provided.');
  }

  if (payload.age !== undefined) {
    if (typeof payload.age !== 'number' || Number.isNaN(payload.age) || payload.age < 0) {
      errors.push('Field "age" must be a number greater than or equal to 0 when provided.');
    }
  }

  if (payload.owner !== undefined && !isValidOwner(payload.owner)) {
    errors.push('Field "owner" must be an object with optional "name" and "contact" strings.');
  }

  return errors;
}

function formatPet(petDocument) {
  if (!petDocument) {
    return null;
  }

  const { _id, ...rest } = petDocument;
  const petId =
    typeof _id === 'string'
      ? _id
      : _id && typeof _id.toString === 'function'
      ? _id.toString()
      : undefined;

  return {
    id: petId,
    ...rest
  };
}

router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validatePetPayload(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Pet data validation failed.',
        errors: validationErrors
      });
    }

    const pet = await Pet.create(req.body);
    const formatted = formatPet(pet.toObject({ versionKey: false }));
    logger.success('Pet created successfully.', {
      id: formatted.id,
      name: formatted.name,
      species: formatted.species
    });

    return res.status(201).json({
      message: 'Pet created successfully.',
      data: formatted
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || DEFAULT_PAGE, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Pet.find().skip(skip).limit(limit).lean(),
      Pet.countDocuments()
    ]);
    logger.info('Pet listing retrieved.', {
      count: items.length,
      total,
      page,
      limit
    });

    return res.json({
      message: 'Pets retrieved successfully.',
      data: items.map(formatPet),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid pet identifier received.', { id });
      return res.status(400).json({ message: 'Pet identifier is not a valid MongoDB ObjectId.' });
    }

    const pet = await Pet.findById(id).lean();

    if (!pet) {
      logger.warn('Pet not found when fetching.', { id });
      return res.status(404).json({ message: 'Pet was not found.' });
    }
    logger.info('Pet retrieved successfully.', { id });

    return res.json({
      message: 'Pet retrieved successfully.',
      data: formatPet(pet)
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid pet identifier received for full update.', { id });
      return res.status(400).json({ message: 'Pet identifier is not a valid MongoDB ObjectId.' });
    }

    const validationErrors = validatePetPayload(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Pet data validation failed.',
        errors: validationErrors
      });
    }

    const pet = await Pet.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      overwrite: true
    }).lean();

    if (!pet) {
      logger.warn('Pet not found when attempting full update.', { id });
      return res.status(404).json({ message: 'Pet was not found.' });
    }
    logger.success('Pet replaced successfully.', { id });

    return res.json({
      message: 'Pet updated successfully.',
      data: formatPet(pet)
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid pet identifier received for partial update.', { id });
      return res.status(400).json({ message: 'Pet identifier is not a valid MongoDB ObjectId.' });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Pet data validation failed.',
        errors: ['Request body must not be empty.']
      });
    }

    const validationErrors = validatePetPayload(req.body, { partial: true });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Pet data validation failed.',
        errors: validationErrors
      });
    }

    const pet = await Pet.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).lean();

    if (!pet) {
      logger.warn('Pet not found when attempting partial update.', { id });
      return res.status(404).json({ message: 'Pet was not found.' });
    }
    logger.success('Pet updated successfully.', {
      id,
      changes: Object.keys(req.body)
    });

    return res.json({
      message: 'Pet updated successfully.',
      data: formatPet(pet)
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid pet identifier received for delete.', { id });
      return res.status(400).json({ message: 'Pet identifier is not a valid MongoDB ObjectId.' });
    }

    const result = await Pet.findByIdAndDelete(id).lean();

    if (!result) {
      logger.warn('Pet not found when attempting delete.', { id });
      return res.status(404).json({ message: 'Pet was not found.' });
    }
    logger.success('Pet deleted successfully.', { id });

    return res.json({
      message: 'Pet deleted successfully.'
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
