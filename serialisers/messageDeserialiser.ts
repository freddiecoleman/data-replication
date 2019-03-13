import * as joi from 'joi';
import * as msgpack from 'msgpack5';
import Message from './message';
import schema from '../schema';

const { decode } = msgpack();

const validateMessage = (message: Message) => {
    const schemaValidation = joi.validate(message, schema.messageSchema);

    if (schemaValidation.error) {
        throw new Error(`Invalid message ${schemaValidation.error}`);
    }
}

const deserialise = (serialisedMessage: Buffer) => {
    const message = decode(serialisedMessage);

    validateMessage(message);

    return message;
};

const messageDeserialiser = { deserialise };

export default messageDeserialiser;
