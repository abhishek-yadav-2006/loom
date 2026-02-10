"use client"
import * as mediasoupClient from "mediasoup-client"
import { useEffect, useRef } from "react"
import { json } from "stream/consumers"

export default function RoomClient({ roomId }: { roomId: string }) {

    const socketRef = useRef<WebSocket | null>(null)
    const deviceRef = useRef<mediasoupClient.Device>(null)
    const deviceLoadRef = useRef(false);
    const sendTransportRef = useRef<mediasoupClient.types.Transport | undefined>(null);
    const recvTransportRef = useRef<mediasoupClient.types.Transport | undefined>(null)



    useEffect(() => {
        deviceRef.current = new mediasoupClient.Device()
    }, [])

    useEffect(() => {
        socketRef.current = new WebSocket("ws://localhost:3000")
        let socket = socketRef.current

        console.log("ws connected from client")

        socketRef.current.onmessage = async (event) => {
            console.log("Backend se aaya:", event.data)

            const message = JSON.parse(event.data);
            if (message.type === 'create-transport') {
                if (!deviceLoadRef.current || sendTransportRef.current) return
                const sendTransportOptions = message.sendTransport;

                const sendTransport = sendTransportRef.current = deviceRef.current?.createSendTransport({
                    id: sendTransportOptions.id,
                    iceCandidates: sendTransportOptions.iceCandidates,
                    iceParameters: sendTransportOptions.iceParameters,
                    dtlsParameters: sendTransportOptions.dtlsParameters
                })
                if (!sendTransport) {
                    return
                }
                sendTransport.on(
                    "connect",
                    ({ dtlsParameters }, onSuccess, onError) => {
                        socketRef.current?.send(JSON.stringify({
                            type: "connect-transport",
                            transportDirection: "send",
                            dtlsParameters
                        }))

                        onSuccess()
                    }
                )

                sendTransport.on('produce', async ({ kind, rtpParameters }, onSuccess, onError) => {
                    try {
                        socketRef.current?.send(JSON.stringify({ type: 'producer', kind, rtpParameters }));
                        const handleProduced = (event: MessageEvent) => {
                            const msg = JSON.parse(event.data);
                            if (msg.type === 'produced') {
                                onSuccess({ id: msg.producerId })
                                socketRef.current?.removeEventListener('message', handleProduced)
                            }
                        }
                        socketRef.current?.addEventListener('message', handleProduced)
                    } catch (err) {
                        //@ts-ignore
                        onError(err)
                    }
                })

                //  recv transport 
                if (!recvTransportRef.current) {
                    const recvTransportOptions = message.recvTransport
                    const recvTransport = recvTransportRef.current = deviceRef.current?.createRecvTransport({
                        id: recvTransportOptions.id,
                        iceCandidates: recvTransportOptions.iceCandidates,
                        iceParameters: recvTransportOptions.iceParameters,
                        dtlsParameters: recvTransportOptions.dtlsParameters
                    })

                    recvTransport?.on("connect", ({ dtlsParameters }, onSuccess) => {
                        socketRef.current?.send(JSON.stringify({
                            type: "connect-transport",
                            transportDirection: "recv",
                            dtlsParameters
                        }))
                        onSuccess()
                    })
                }

            }

            if (message.type === 'router-rtp-capabilities') {
                await deviceRef.current?.load({
                    routerRtpCapabilities: message.rtpCapabilities
                })

                deviceLoadRef.current = true;

                socket.send(JSON.stringify({
                    type: "create-transport"
                }))
            }

            if (message.type === 'consumed') {
                const { id, producerId, kind, rtpParameters } = message
                const recvTransport = recvTransportRef.current
                if (!recvTransport) return

                const stream = new MediaStream()
                const consumer = await recvTransport.consume({
                    id,
                    producerId,
                    kind,
                    rtpParameters

                })

                stream.addTrack(consumer.track)

                const videoEl = document.createElement("video")
                videoEl.srcObject = stream
                videoEl.autoplay = true
                videoEl.playsInline = true
                document.body.appendChild(videoEl)
            }


        }

        return () => {
            socket.close()
        }
    }, [])

    useEffect(() => {
        if (!sendTransportRef.current || !deviceLoadRef.current) return;

        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                const videoTrack = stream.getVideoTracks()[0];

                const producer = await sendTransportRef.current?.produce({ track: videoTrack });

                console.log("Camera producing, producer id:", producer?.id);
            } catch (err) {
                console.error("Error accessing camera or producing track:", err);
            }
        };

        initCamera();
    }, [deviceLoadRef.current, sendTransportRef.current]);


    return <div>hi there {roomId}</div>
}
