import * as EventEmitter from 'events';
import * as express from 'express';
import * as joi from 'joi';
import * as pino from 'pino';
import LocalState from '../localState';
import protocol from '../protocol';
import schema from '../schema';

const log = pino();

/**
 * Route for inserting data into the cluster over HTTP.
 * 
 * @param {*} local 
 * @param {*} eventEmitter 
 */
const addDataRoute = (localState: LocalState, eventEmitter: EventEmitter) => (req: express.Request, res: express.Response) => {
    const requestValidation = joi.validate(req.body, schema.addDataRequestSchema);

    if (requestValidation.error) {
        log.error(`Received invalid request ${requestValidation.error}`);

        return res.status(400).json({ error: requestValidation.error });
    }

    const { body: { data } } = req;

    const rumorMessage = {
        [protocol.rumorMessage.ORIGIN]: localState.name,
        [protocol.rumorMessage.FROM]: localState.name,
        [protocol.rumorMessage.SEQUENCE]: localState.getSequenceNumber() + 1,
        [protocol.rumorMessage.DATA]: data
    };

    res.status(200).send('Data added');

    eventEmitter.emit('message:rumor', rumorMessage);
};

export default addDataRoute;
