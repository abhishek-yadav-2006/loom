import { WebSocket, WebSocketServer } from 'ws'
import http from 'http'

import * as mediasoup from 'mediasoup'
import { json } from 'stream/consumers'
import { isAwaitKeyword } from 'typescript'
import { SocketAddress } from 'net'
import { getConsumerRtpParameters } from 'mediasoup/ortc'

let worker: mediasoup.types.Worker | undefined
let router: mediasoup.types.Router | undefined
const producersMap: Map<string, mediasoup.types.Producer[]> = new Map()
const transportsMap: Map<string, mediasoup.types.WebRtcTransport> = new Map()


const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
    {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
        preferredPayloadType: 96
    },
    {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {},
        preferredPayloadType: 100
    },
];


async function initMediasoup() {
    //worker ban gya
    worker = await mediasoup.createWorker({
        rtcMinPort: 40000,
        rtcMaxPort: 49999
    })

    console.log("mediasoup worker created");

    //router ban gya

    router = await worker.createRouter({ mediaCodecs })



    console.log(" mediasoup router created");
}






// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

let Rooms: Map<string, Set<WebSocket>> = new Map();


let socketIds = new Map<WebSocket, string>(); // unique id for each socket

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

function deleteRoom(ws: WebSocket) {
    Rooms.forEach((clients, RoomId) => {
        if (clients.has(ws)) {
            clients.delete(ws)
        }

        if (clients.size === 0) {
            Rooms.delete(RoomId)
        }
    })
}


export function initws(server: http.Server) {

    // func call for worker creation

    initMediasoup()


    const wss = new WebSocketServer({ server })

    wss.on('connection', async (socket) => {


        const id = generateId();

        socketIds.set(socket, id)



        if (!router) throw new Error("Router not initialized");

        // ab transport create krna h 
        const transport = await router?.createWebRtcTransport({
            listenIps: [{ ip: '0.0.0.0', announcedIp: 'my-public-ip' }],
            enableUdp: true,
            enableTcp: true,
            preferTcp: true
        })
        transportsMap.set(id, transport)


        socket.on('message', async (data) => {
            console.log("data", data.toString())

            let msg = JSON.parse(data.toString());

            // join rrom

            if (msg.type === 'join-room') {
                const roomId = msg.roomId;
                console.log("roomId", roomId)
                if (!Rooms.has(roomId)) {
                    Rooms.set(roomId, new Set<WebSocket>());
                }

                const clients = Rooms.get(roomId)!
                clients.add(socket)
                console.log("clients size:", clients.size);
                console.log("clients list:", [...clients]);


                // notify other user tht the new user has joined\\\

                const existingUsers = [...clients]

                existingUsers.filter((s: WebSocket) => s !== socket).map((s: WebSocket) => socketIds.get(s));
                // console.log("existingUsers", existingUsers);

                clients.forEach((s: WebSocket) => {
                    if (s !== socket) {
                        s.send(JSON.stringify(({ type: 'user-joined', userId: id })))
                    }

                });

                for (const [otherSocket, otherId] of socketIds) {
                    if (otherSocket === socket) continue; // skip self

                    const userProducers = producersMap.get(otherId)

                    const otherTransport = transportsMap.get(otherId);
                    if (!otherTransport) continue;

                    if (!userProducers) continue;

                    for (const producer of userProducers) {
                        if (router?.canConsume({ producerId: producer.id, rtpCapabilities: msg.rtpCapabilities })) {
                            const consumer = await otherTransport?.consume({
                                producerId: producer.id,
                                rtpCapabilities: msg.rtpCapabilities,
                                paused: false
                            })

                            socket.send(JSON.stringify({
                                type: 'consumed',
                                producerId: producer.id,
                                kind: consumer?.kind,
                                id: consumer?.id,
                                rtpParameters: consumer?.rtpParameters
                            }))
                        }


                    }

                }
            }


            if (msg.type === 'chat') {
                const { roomId, message } = msg;

                let clients = Rooms.get(roomId);

                clients?.forEach((s: WebSocket) => {
                    if (s !== socket) {
                        s.send(JSON.stringify({ type: 'chat', userId: id, message }))
                    }
                })
            }


            //+++++++++++++++webrtc   
            /// connect trnasport for dtls

            if (msg.type == 'connect-transport') {
                const dtlsParameters = msg.dtlsParameters;   // dtls prameter browser send krta h isme fingerprint ya certificate hota h for secr==uirty issue

                //  ab is dtlsprameter ko server ke ptransport se connect krt h taki ek secure connection ban sake
                await transport?.connect({ dtlsParameters })

                socket.send(JSON.stringify({
                    type: 'transport-connected'
                }))

            }


            // ab producer setup hoga

            if (msg.type === 'producer') {
                const { kind, rtpParameters } = msg;

                const producer = await transport?.produce({
                    kind,
                    rtpParameters      ////  rtpParameters → Browser ne send kiye jo actual media ka format, codecs etc. batate hain
                })


                const userProducers = producersMap.get(id) || [];
                userProducers?.push(producer!)

                producersMap.set(id, userProducers)


                socket.send(JSON.stringify({
                    type: 'produced',
                    producerId: producer?.id
                }))
            }


            //  ab consumer ka logic  likha h

            // Naye user ko purane producers ka media bhejna


            if (msg.type === 'consumer') {

                const { producerId, rtpCapabilities } = msg;

                // chec k router can consume 

                if (router?.canConsume({ producerId, rtpCapabilities })) {
                    const consumer = await transport?.consume({

                        producerId,
                        rtpCapabilities,
                        paused: false
                    })
                    socket.send(JSON.stringify({
                        type: 'consumed',
                        producerId,
                        id: consumer?.id,
                        kind: consumer?.kind,
                        rtpParameters: consumer?.rtpParameters
                    }))
                }




            }



        })

        socket.on('close', () => {
            console.log(`user disconnected!  ${id}`)

            producersMap.delete(id)
            transportsMap.delete(id)
  
            
            Rooms.forEach((clients, roomId) => {
                if (clients.has(socket)) {
                    clients.delete(socket)
                }

                clients.forEach((s: WebSocket) => {
                    s.send(JSON.stringify({ type: 'user-left', userId: id }))
                })
            })

            deleteRoom(socket)
            socketIds.delete(socket);
        })


        //// +++++++++++++++++++++++++web rtc logic from here

        socket.send(JSON.stringify({
            type: 'create-transport',
            transportOptions: {
                id: transport?.id,
                iceCandidates: transport?.iceCandidates,
                iceParameters: transport?.iceParameters,
                dtlsParameters: transport?.dtlsParameters
            }
        }))



    })

}

