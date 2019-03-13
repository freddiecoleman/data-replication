import * as joi from 'joi';

const localSchema = joi.object().keys({
    name: joi.string(),
    port: joi.number(),
    httpServerPort: joi.number(),
    logInterval: joi.number(),
    ackTimeout: joi.number(),
    antiEntropyInterval: joi.number()
});

const peerSchema = joi.object().keys({
    hostname: joi.string(),
    port: joi.number()
});

const configSchema = joi.object().keys({
    local: localSchema,
    peers: joi.object().pattern(/^/, peerSchema)
});

export default configSchema;
