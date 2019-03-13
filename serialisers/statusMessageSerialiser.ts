import * as joi from 'joi';
import * as msgpack from 'msgpack5';
import Message from './message';
import schema from '../schema';
import protocol from '../protocol';

const { encode } = msgpack();

const validateStatusMessage = (statusMessage: Message) => {
    const schemaValidation = joi.validate(statusMessage, schema.statusMessageSchema);

    if (schemaValidation.error) {
        throw new Error(`Invalid statusMessage ${schemaValidation.error}`);
    }
}

const serialise = (statusMessage: Message) => {
    validateStatusMessage(statusMessage);

    const serialisedStatusMessage = encode({ [protocol.messageType.STATUS]: statusMessage });
    
    return serialisedStatusMessage;
};

const statusMessageSerialiser = { serialise };

export default statusMessageSerialiser;
