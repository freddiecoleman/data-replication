import * as fs from 'fs';
import { parseConfigFile, getRandomPeer, Peers } from '../../utils';

const fakeFilePath = './config/config1.toml';

describe('utils', () => {
    let readFileSync: jasmine.Spy;

    beforeAll(() => {
        readFileSync = spyOn(fs, 'readFileSync');
    });

    describe('#getRandomPeer', () => {
        const peers: Peers = {
            sapporo: {
                name: 'sapporo',
                hostname: 'sapporo.jp',
                port: 1
            },
            kobe: {
                name: 'kobe',
                hostname: 'kobe.jp',
                port: 2
            },
            aomori: {
                name: 'aomori',
                hostname: 'aomori.jp',
                port: 3
            }
        };
        let randomSpy: jasmine.Spy;

        beforeEach(() => {
            randomSpy = spyOn(Math, 'random')
        })

        it('selects the first peer', () => {
            randomSpy.and.returnValue(0);

            expect(getRandomPeer(peers)).toEqual({
                name: 'sapporo',
                hostname: 'sapporo.jp',
                port: 1
            });
        });

        it('selects the second peer', () => {
            randomSpy.and.returnValue(0.5);

            expect(getRandomPeer(peers)).toEqual({
                name: 'kobe',
                hostname: 'kobe.jp',
                port: 2
            });
        });

        it('selects the third peer', () => {
            randomSpy.and.returnValue(0.9);

            expect(getRandomPeer(peers)).toEqual({
                name: 'aomori',
                hostname: 'aomori.jp',
                port: 3
            });
        });
    });

    describe('#parseConfigFile', () => {
        it('throws error when file does not contain toml', () => {
            readFileSync.and.callFake((path: string) => {
                expect(path).toBe(fakeFilePath);

                return 'this is not toml';
            });

            expect(() => parseConfigFile(fakeFilePath)).toThrow(new Error('Error parsing TOML in config file'));
        });

        it('throws error on valid toml but invalid config', () => {
            readFileSync.and.callFake((path: string) => {
                expect(path).toBe(fakeFilePath);

                return '[notvalid]';
            });

            expect(() => parseConfigFile(fakeFilePath)).toThrow(new Error('Invalid config in \'./config/config1.toml\' ValidationError: "notvalid" is not allowed'));
        });

        it('parses a valid toml config file', () => {
            const tomlFile = `[local]
                name = "queen"
                port = 9090
                httpServerPort = 8080
                logInterval = 2500
                ackTimeout = 1000
                antiEntropyInterval = 10000
                
                [peers]
                
                [peers.bishop]
                hostname = "peer2"
                port = 9091
                
                [peers.knight]
                hostname = "peer3"
                port = 9092
                
                [peers.rook]
                hostname = "peer4"
                port = 9093
                
                [peers.pawn]
                hostname = "peer5"
                port = 9094
            `;
            readFileSync.and.callFake((path: string) => {
                expect(path).toBe(fakeFilePath);

                return tomlFile;
            });

            expect(parseConfigFile(fakeFilePath)).toEqual({
                local: {
                    name: 'queen',
                    port: 9090,
                    httpServerPort: 8080,
                    logInterval: 2500,
                    ackTimeout: 1000,
                    antiEntropyInterval: 10000
                },
                peers: {
                    bishop: {
                        hostname: 'peer2',
                        port: 9091
                    },
                    knight: {
                        hostname: 'peer3',
                        port: 9092
                    },
                    rook: {
                        hostname: 'peer4',
                        port: 9093
                    },
                    pawn: {
                        hostname: 'peer5',
                        port: 9094
                    }
                }
            });

        });
    });
});