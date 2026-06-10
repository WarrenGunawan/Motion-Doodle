import { useEffect, useRef } from 'react'

function RemoteCam({ stream, camWidth, camHeight }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!stream || !videoRef.current) return
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(err => console.error('play error:', err))
    }, [stream])

    useEffect(() => {
        let animationId

        function draw() {
            const video = videoRef.current
            const canvas = canvasRef.current

            if (!video || !canvas || video.readyState < 2) {
                animationId = requestAnimationFrame(draw)
                return
            }

            canvas.width = camWidth
            canvas.height = camHeight

            const ctx = canvas.getContext('2d')
            const videoAspect = video.videoWidth / video.videoHeight
            const canvasAspect = camWidth / camHeight

            let sx, sy, sw, sh
            if (videoAspect > canvasAspect) {
                sh = video.videoHeight
                sw = sh * canvasAspect
                sx = (video.videoWidth - sw) / 2
                sy = 0
            } else {
                sw = video.videoWidth
                sh = sw / canvasAspect
                sx = 0
                sy = (video.videoHeight - sh) / 2
            }

            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, camWidth, camHeight)
            animationId = requestAnimationFrame(draw)
        }

        animationId = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(animationId)
    }, [camWidth, camHeight])

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
    )
}

export default RemoteCam