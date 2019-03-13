import * as joi from 'joi';
import protocol from '../protocol';

const rumorMessageSchema = joi.object().keys({
    [protocol.rumorMessage.ORIGIN]: joi.string(),
    [protocol.rumorMessage.FROM]: joi.string(),
    [protocol.rumorMessage.SEQUENCE]: joi.number(),
    [protocol.rumorMessage.DATA]: joi.string()
});

export default rumorMessageSchema;
