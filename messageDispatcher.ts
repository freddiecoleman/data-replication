const dgram = require('dgram');
const log = require('pino')();
const { promisify } = require('util');
import Message from './serialisers/message';
const protocol = require('./protocol');
const { rumorMessageSerialiser, statusMessageSerialiser } = require('./serialisers');
import { Peer, Peers } from './utils';

/**
 * Takes a binary message and sends it to a remote peer over UDP.
 * 
 * @param {*} message 
 * @param {*} peer 
 */
const sendMessageToPeer = async(message: Message, peer: Peer): Promise<boolean> => {
    const client = dgram.createSocket('udp4');
    const send = promisify(client.send.bind(client));
    let sendSuccess = false;

    try {
        await send(message, peer.port, peer.hostname);
        sendSuccess = true;
    } catch (err) {
        log.error(`Error sending message over UDP to ${peer.hostname}:${peer.port}`)
        log.error(err);
    } finally {
        log.trace('Closing UDP client connection');

        client.close();
    }

    return sendSuccess;
};

/**
 * Serialises rumor message to binary and sends it to remote peer.
 * 
 * @param {*} rumorMessage 
 * @param {*} peer 
 * @param {*} localName 
 */
const sendRumorMessage = async (rumorMessage: Message, peer: Peer, localName: string): Promise<boolean> => {
    let serialisedRumorMessage = null;

    // We may replicate a message from a different origin
    rumorMessage[protocol.rumorMessage.FROM] = localName;

    try {
        serialisedRumorMessage = rumorMessageSerialiser.serialise(rumorMessage);
    } catch (err) {
        log.error('Failed to serialise message');
        log.error(err);

        return false;
    }

    const sent = await sendMessageToPeer(serialisedRumorMessage, peer);

    return sent;
};

/**
 * Serialises status message to binary and sends it to remote peer.
 * 
 * @param {*} statusMessage 
 * @param {*} peer 
 */
const sendStatusMessage = async (statusMessage: Message, peer: Peer) => {
    let serialisedStatusMessage = null;

    try {
        serialisedStatusMessage = statusMessageSerialiser.serialise(statusMessage);
    } catch (err) {
        log.error('Failed to serialise message');
        log.error(err);

        return;
    }

    await sendMessageToPeer(serialisedStatusMessage, peer);
};

/**
 * Sends acknowledgement to peer if a rumor message did not come from the local HTTP server
 * 
 * @param {*} rumorMessage 
 * @param {*} statusMessage 
 * @param {*} localName 
 * @param {*} peers 
 */
const ack = async (rumorMessage: Message, statusMessage: Message, localName: string, peers: Peers) => {
    const fromPeer = rumorMessage[protocol.rumorMessage.FROM];

    if (fromPeer !== localName) {
        log.info(`Sending status message to ${fromPeer}`);

        await sendStatusMessage(statusMessage, peers[fromPeer]);
    }
};

const messageDispatcher = {
    sendRumorMessage,
    sendStatusMessage,
    ack
};

export default messageDispatcher;
