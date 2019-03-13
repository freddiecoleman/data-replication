# Data replication in TypeScript

## Description

This project demonstrates replication using a gossip protocol over UDP. When replicating to a peer it is expected that the peer will acknowledge the rumor message by replying with a status message which contains a `want` which is the highest sequence number already processed by that node + 1. If no acknowledgement is received within a configurable timeout the rumor message will be sent to another random peer.

On receipt of a status message a node will check to see if it is up to date with the remote peer and one of three things can happen:

- It is up to date and nothing needs to happen.
- The local node is ahead of the remote peer - the node sends a rumor message for the sequence number that the remote peer requested in the status message. The remote peer will acknowledge receipt with another status message with the next sequence number ensuring that it will receive all messages in the correct order
- The local node is behind the remote peer - the node sends a status message to the remote peer which will then recognise that this node is behind and respond with the next rumor message that is required

Every node will send a status message to a random peer at a configurable interval as an anti-entropy measure. This ensures that every node is eventually brought up to date.

Messages are serialised to a binary format called [MessagePack](https://msgpack.org/). They keys of each message are constants defined in `protocol.js` to reduce the size.

## Running this project

If you have docker installed a cluser of 5 nodes can be spawned with:

```
docker-compose up
```

On startup all of the nodes will have no data. In order to get some initial data into the cluster each node exposes a REST API which can be accessed from the host machine on ports 8080, 8081, and 8082. This API can be used to post data to the `/add` endpoint which is then replicated to the cluster.
