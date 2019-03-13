import * as fs from 'fs';
import * as pino from 'pino';
import * as joi from 'joi';
import * as toml from 'toml';
import schema from './schema';

const log = pino();

export interface Peer {
    name: string;
    hostname: string;
    port: number;
}

export interface Peers {
    [peerName: string]: Peer;
}

export const parseConfigFile = (configFilePath: string) => {
    const configFile: string = fs.readFileSync(configFilePath).toString('utf8');
    let config = null;
    try {
        config = toml.parse(configFile);
    } catch (err) {
        log.error(err);
        throw new Error('Error parsing TOML in config file');
    }
    const configValidation = joi.validate(config, schema.configSchema);

    if (configValidation.error) {
        throw new Error(`Invalid config in '${configFilePath}' ${configValidation.error}`)
    }

    return config;
}

export const getRandomPeer = (peers: Peers): Peer => {
    const peerNames = Object.keys(peers);
    const peerCount = peerNames.length;
    const chosenPeerName = peerNames[Math.floor(Math.random() * Math.floor(peerCount))];

    return {
        name: chosenPeerName,
        ...peers[chosenPeerName]
    };
};
