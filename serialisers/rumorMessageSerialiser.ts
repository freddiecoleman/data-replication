import * as joi from 'joi';
import * as msgpack from 'msgpack5';
import Message from './message';
import schema from '../schema';
import protocol from '../protocol';

const { encode } = msgpack();

const validateRumorMessage = (rumorMessage: Message) => {
    const schemaValidation = joi.validate(rumorMessage, schema.rumorMessageSchema);

    if (schemaValidation.error) {
        throw new Error(`Invalid rumorMessage ${schemaValidation.error}`);
    }
}

const serialise = (rumorMessage: Message) => {
    validateRumorMessage(rumorMessage);

    const serialisedRumorMessage = encode({ [protocol.messageType.RUMOR]: rumorMessage });
    
    return serialisedRumorMessage;
};

const rumorMessageSerialiser = { serialise };

export default rumorMessageSerialiser;
