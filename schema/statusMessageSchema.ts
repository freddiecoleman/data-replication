import * as joi from 'joi';
import protocol from '../protocol';

const statusMessageSchema = joi.object().keys({
    [protocol.statusMessage.ORIGIN]: joi.string(),
    [protocol.statusMessage.WANT]: joi.number()
});

export default statusMessageSchema;
