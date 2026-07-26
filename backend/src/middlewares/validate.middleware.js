/**
 * middlewares/validate.middleware.js — Request Validation Middleware
 * Pocket C.A. Backend
 *
 * Factory that creates a validation middleware from a Joi schema.
 * Validates req.body or req.query and passes sanitized values onward.
 *
 * Usage:
 *   router.post('/', validate(createTransactionSchema), controller);
 *   router.get('/',  validate(listQuerySchema, 'query'), controller);
 */

const ApiError = require('../utils/ApiError');

/**
 * @param {Joi.Schema} schema  - Joi schema to validate against
 * @param {'body'|'query'} target - Which part of the request to validate
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,     // collect ALL errors, not just first
    stripUnknown: true,    // remove any fields not in schema
    convert: true,         // coerce types (e.g. string → number for query params)
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));

    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details);
  }

  // Replace req[target] with Joi-sanitized values (coerced types, defaults applied)
  req[target] = value;
  next();
};

module.exports = validate;
