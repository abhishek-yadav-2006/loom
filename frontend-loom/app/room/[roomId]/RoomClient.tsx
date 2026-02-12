'use client'

import * as mediasoupClient from 'mediasoup-client'
import { useEffect, useRef, useState } from 'react'

type Peer = {
    id: string
    stream: MediaStream
}

export default function RoomClient({ roomId }: { roomId: string }) {
    const socketRef = useRef<WebSocket | null>(null)
    const deviceRef = useRef<mediasoupClient.Device | null>(null)
    const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null)
    const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null)

    const [peers, setPeers] = useState<Peer[]>([])
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)


    useEffect(() => {
        deviceRef.current = new mediasoupClient.Device()
    }, [])


    useEffect(() => {
        if (!roomId) return

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'
        const socket = new WebSocket(wsUrl)
        socketRef.current = socket

        socket.onopen = () => {
            console.log('✅ WebSocket connected')

            socket.send(
                JSON.stringify({
                    type: 'join-room',
                    roomId,
                })
            )
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data)


            if (message.type === 'router-rtp-capabilities') {
                await deviceRef.current?.load({
                    routerRtpCapabilities: message.rtpCapabilities,
                })

                socket.send(JSON.stringify({ type: 'create-transport' }))
            }


            else if (message.type === 'create-transport') {
                if (!deviceRef.current) return


                if (!sendTransportRef.current) {
                    const sendTransport =
                        deviceRef.current.createSendTransport(message.sendTransport)

                    sendTransportRef.current = sendTransport

                    sendTransport.on('connect', ({ dtlsParameters }, callback) => {
                        socket.send(
                            JSON.stringify({
                                type: 'connect-transport',
                                transportDirection: 'send',
                                dtlsParameters,
                            })
                        )
                        callback()
                    })

                    sendTransport.on(
                        'produce',
                        ({ kind, rtpParameters }, callback) => {
                            socket.send(
                                JSON.stringify({
                                    type: 'producer',
                                    kind,
                                    rtpParameters,
                                })
                            )

                            const handler = (event: MessageEvent) => {
                                const msg = JSON.parse(event.data)
                                if (msg.type === 'produced') {
                                    callback({ id: msg.producerId })
                                    socket.removeEventListener('message', handler)
                                }
                            }

                            socket.addEventListener('message', handler)
                        }
                    )

                    startLocalMedia()
                }


                if (!recvTransportRef.current) {
                    const recvTransport =
                        deviceRef.current.createRecvTransport(message.recvTransport)

                    recvTransportRef.current = recvTransport

                    recvTransport.on('connect', ({ dtlsParameters }, callback) => {
                        socket.send(
                            JSON.stringify({
                                type: 'connect-transport',
                                transportDirection: 'recv',
                                dtlsParameters,
                            })
                        )
                        callback()
                    })
                }
            }


            else if (message.type === 'consumed') {
                const { id, producerId, kind, rtpParameters } = message
                const recvTransport = recvTransportRef.current
                if (!recvTransport) return

                const consumer = await recvTransport.consume({
                    id,
                    producerId,
                    kind,
                    rtpParameters,
                })
                console.log("Consuming producer:", producerId)


                const stream = new MediaStream()
                stream.addTrack(consumer.track)

                setPeers((prev) => {
                    if (prev.find((p) => p.id === producerId)) return prev
                    return [...prev, { id: producerId, stream }]
                })
            }

            else if (message.type === 'user-left') {
                setPeers((prev) =>
                    prev.filter((peer) => peer.id !== message.userId)
                )
            }
            else if (message.type === 'new-producer') {
                socket.send(
                    JSON.stringify({
                        type: 'consumer',
                        producerId: message.producerId,
                        rtpCapabilities: deviceRef.current?.rtpCapabilities,
                    })
                )
            }

        }


        return () => {
            socket.close()
        }
    }, [roomId])


    const startLocalMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            })

            setLocalStream(stream)

            const sendTransport = sendTransportRef.current
            if (!sendTransport) return

            for (const track of stream.getTracks()) {
                await sendTransport.produce({ track })
            }
        } catch (err) {
            setError('Camera/Microphone permission denied')
            console.error(err)
        }
    }


    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <h1 className="text-2xl mb-4">Room: {roomId}</h1>

            {error && (
                <div className="bg-red-900 p-3 mb-4 rounded">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {localStream && (
                    <div className="relative bg-gray-900 rounded overflow-hidden aspect-video">
                        <video
                            ref={(el) => {
                                if (el) el.srcObject = localStream
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-blue-600 px-2 py-1 rounded text-sm">
                            You
                        </div>
                    </div>
                )}

                {peers.map((peer) => (
                    <div
                        key={peer.id}
                        className="relative bg-gray-900 rounded overflow-hidden aspect-video"
                    >
                        <video
                            ref={(el) => {
                                if (el) el.srcObject = peer.stream
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-gray-700 px-2 py-1 rounded text-sm">
                            {peer.id.slice(0, 6)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
