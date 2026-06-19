import { useEffect, useRef } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { detectOneFinger, detectFiveFingers, detectWebslinger } from '../detect'

export default function Camera({ camWidth, camHeight, canDraw, stream, onCompositeCanvas, shouldClear }) {
    const videoRef = useRef(null)
    const videoCanvasRef = useRef(null)
    const drawCanvasRef = useRef(null)
    const landmarkerRef = useRef(null)
    const drawingRef = useRef({
        prevX: null,
        prevY: null,
        drawStart: null,
        eraseStart: null,
        clearStart: null
    })
    const compositeCanvasRef = useRef(null)
    const compositeCalledRef = useRef(false)

    const DELAY = 0.7
    const brushColor = '#000000'
    const brushSize = 15
    const eraserSize = 50

    // Initialize MediaPipe
    useEffect(() => {
        async function initMediaPipe() {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            )
            landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: '/hand_landmarker.task',
                },
                runningMode: 'VIDEO',
                numHands: 1,
                minHandDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            })
        }
        initMediaPipe()
    }, [])

    // Start camera
    useEffect(() => {
        if (!stream || !videoRef.current) return

        const video = videoRef.current
        video.srcObject = stream

        const cw = Math.round(camWidth)
        const ch = Math.round(camHeight)

        videoCanvasRef.current.width = cw
        videoCanvasRef.current.height = ch
        drawCanvasRef.current.width = cw
        drawCanvasRef.current.height = ch

        video.play()
    }, [stream, camWidth, camHeight])

    // Clear canvas when turn ends
    useEffect(() => {
        if (shouldClear && drawCanvasRef.current) {
            const ctx = drawCanvasRef.current.getContext('2d')
            ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height)
        }
    }, [shouldClear])

    // Detection loop
    useEffect(() => {
        let animationId

        function detect() {
            const video = videoRef.current
            const videoCanvas = videoCanvasRef.current
            const drawCanvas = drawCanvasRef.current
            const landmarker = landmarkerRef.current

            if (!video || !videoCanvas || !drawCanvas || !landmarker || video.readyState < 2) {
                animationId = requestAnimationFrame(detect)
                return
            }

            const w = videoCanvas.width
            const h = videoCanvas.height

            if (w === 0 || h === 0) {
                animationId = requestAnimationFrame(detect)
                return
            }

            const videoCtx = videoCanvas.getContext('2d')
            const drawCtx = drawCanvas.getContext('2d')
            const state = drawingRef.current

            // Draw flipped video feed onto video canvas every frame
            const videoAspect = video.videoWidth / video.videoHeight
            const canvasAspect = w / h

            let sx, sy, sw, sh
            if (videoAspect > canvasAspect) {
                // video is wider than canvas — crop sides (unlikely for 9/16 but just in case)
                sh = video.videoHeight
                sw = sh * canvasAspect
                sx = (video.videoWidth - sw) / 2
                sy = 0
            } else {
                // video is taller than canvas — crop top/bottom (your case)
                sw = video.videoWidth
                sh = sw / canvasAspect
                sx = 0
                sy = (video.videoHeight - sh) / 2
            }

            videoCtx.clearRect(0, 0, w, h)

            videoCtx.save()
            videoCtx.scale(-1, 1)
            videoCtx.translate(-w, 0)
            videoCtx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h)
            videoCtx.restore()

            if (!canDraw) {
                animationId = requestAnimationFrame(detect)
                return
            }

            // Run hand detection
            const results = landmarker.detectForVideo(video, performance.now())

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0]

                // Mirror landmark x positions to match flipped video
                const mirrored = landmarks.map(lm => ({ ...lm, x: 1 - lm.x }))

                const ix = ((mirrored[8].x * video.videoWidth - sx) / sw) * w
                const iy = ((mirrored[8].y * video.videoHeight - sy) / sh) * h
                const ex = (((mirrored[0].x + mirrored[9].x) / 2 * video.videoWidth - sx) / sw) * w
                const ey = (((mirrored[0].y + mirrored[9].y) / 2 * video.videoHeight - sy) / sh) * h

                const oneFingerUp = detectOneFinger(mirrored, w, h)
                const fiveFingers = detectFiveFingers(mirrored, w, h)
                const webslinger = detectWebslinger(mirrored, w, h)

                const now = performance.now() / 1000

                if (webslinger) {
                    // Clear draw canvas only
                    if(state.clearStart === null) state.clearStart = now
                    const elapsed = now - state.clearStart

                    if (elapsed >= 1.2) {
                        drawCtx.clearRect(0, 0, w, h)
                        state.prevX = null
                        state.prevY = null
                        state.drawStart = null
                        state.eraseStart = null
                        state.clearStart = null
                    }

                } else if (oneFingerUp) {
                    if (state.drawStart === null) state.drawStart = now
                    const elapsed = now - state.drawStart

                    if (elapsed >= DELAY) {
                        if (state.prevX !== null && state.prevY !== null) {
                            drawCtx.beginPath()
                            drawCtx.moveTo(state.prevX, state.prevY)
                            drawCtx.lineTo(ix, iy)
                            drawCtx.strokeStyle = brushColor
                            drawCtx.lineWidth = brushSize
                            drawCtx.lineCap = 'round'
                            drawCtx.stroke()
                        }
                        state.prevX = ix
                        state.prevY = iy
                    } else {
                        state.prevX = null
                        state.prevY = null
                    }
                    state.eraseStart = null
                    state.clearStart = null

                } else if (fiveFingers) {
                    if (state.eraseStart === null) state.eraseStart = now
                    const elapsed = now - state.eraseStart

                    if (elapsed >= DELAY) {
                        if (state.prevX !== null && state.prevY !== null) {
                            drawCtx.beginPath()
                            drawCtx.moveTo(state.prevX, state.prevY)
                            drawCtx.lineTo(ex, ey)
                            drawCtx.strokeStyle = 'rgba(0,0,0,1)'
                            drawCtx.lineWidth = eraserSize
                            drawCtx.lineCap = 'round'
                            drawCtx.globalCompositeOperation = 'destination-out'
                            drawCtx.stroke()
                            drawCtx.globalCompositeOperation = 'source-over'
                        }
                        state.prevX = ex
                        state.prevY = ey
                    } else {
                        state.prevX = null
                        state.prevY = null
                    }
                    state.drawStart = null
                    state.clearStart = null

                } else {
                    state.prevX = null
                    state.prevY = null
                    state.drawStart = null
                    state.eraseStart = null
                    state.clearStart = null
                }
            }

            const compositeCanvas = compositeCanvasRef.current
            if (compositeCanvas) {
                compositeCanvas.width = w
                compositeCanvas.height = h
                const compositeCtx = compositeCanvas.getContext('2d')
                compositeCtx.drawImage(videoCanvas, 0, 0)
                compositeCtx.drawImage(drawCanvas, 0, 0)
            }

            if (!compositeCalledRef.current && onCompositeCanvas) {
                onCompositeCanvas(compositeCanvasRef.current)
                compositeCalledRef.current = true
            }

            animationId = requestAnimationFrame(detect)
            console.log('video native:', video.videoWidth, video.videoHeight, 'canvas:', w, h, 'crop:', sx, sy, sw, sh)
        }

        animationId = requestAnimationFrame(detect)
        return () => cancelAnimationFrame(animationId)
    }, [])

    return (
        <div
            style={{
                position: 'relative',
                width: `${camWidth}px`,
                height: `${camHeight}px`,
                overflow: 'hidden',
                backgroundColor: 'purple',
                lineHeight: 0,
                fontSize: 0,
            }}
        >
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ display: 'none' }}
            />

            <canvas
                ref={videoCanvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
            />

            <canvas
                ref={drawCanvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    pointerEvents: 'none',
                }}
            />

            <canvas ref={compositeCanvasRef} style={{ display: 'none' }} />
        </div>
    )
}