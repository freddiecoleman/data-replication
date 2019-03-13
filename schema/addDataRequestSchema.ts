import * as joi from 'joi';

const addDataRequestSchema = joi.object().keys({ data: joi.string() });

export default addDataRequestSchema;
