import * as joi from 'joi';
import protocol from '../protocol';
import rumorMessageSchema from './rumorMessageSchema';
import statusMessageSchema from './statusMessageSchema';

const messageSchema = joi.object().keys({
    [protocol.messageType.RUMOR]: rumorMessageSchema,
    [protocol.messageType.STATUS]: statusMessageSchema
}).or(protocol.messageType.RUMOR.toString(), protocol.messageType.STATUS.toString());

export default messageSchema;
