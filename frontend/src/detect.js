function getPalmCenter(landmarks, w, h) {
    const palmIds = [0, 1, 5, 9, 13, 17]
    const xs = palmIds.map(i => landmarks[i].x * w)
    const ys = palmIds.map(i => landmarks[i].y * h)
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length
    return { cx: Math.round(cx), cy: Math.round(cy) }
}


function getHandScale(landmarks, w, h) {
    const wrist = landmarks[0]
    const midKnuckle = landmarks[9]
    const wx = wrist.x * w
    const wy = wrist.y * h
    const mx = midKnuckle.x * w
    const my = midKnuckle.y * h
    return Math.sqrt((mx - wx) ** 2 + (my - wy) ** 2)
}


function getFingerDist(landmarks, tipId, cx, cy, w, h) {
    const tip = landmarks[tipId]
    const tx = tip.x * w
    const ty = tip.y * h
    return Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2)
}


function getFingersUp(landmarks, w, h) {
    const { cx, cy } = getPalmCenter(landmarks, w, h)
    const threshold = getHandScale(landmarks, w, h) * 0.5
    const tipIds = [8, 12, 16, 20]
    return tipIds.map(tip => getFingerDist(landmarks, tip, cx, cy, w, h) > threshold)
}


export function detectOneFinger(landmarks, w, h) {
    const [index, middle, ring, pinky] = getFingersUp(landmarks, w, h)
    return index && !middle && !ring && !pinky
}


export function detectTwoFingers(landmarks, w, h) {
    const [index, middle, ring, pinky] = getFingersUp(landmarks, w, h)
    return index && middle && !ring && !pinky
}


export function detectFiveFingers(landmarks, w, h) {
    const [index, middle, ring, pinky] = getFingersUp(landmarks, w, h)
    return index && middle && ring && pinky
}


export function detectWebslinger(landmarks, w, h) {
    const [index, middle, ring, pinky] = getFingersUp(landmarks, w, h)
    
    const thumbTipX = landmarks[4].x
    const indexBaseX = landmarks[5].x

    // Scale threshold based on hand size instead of fixed value
    const handSize = getHandScale(landmarks, w, h)
    const normalizedHandSize = handSize / w  // convert back to 0-1 range
    const thumbUp = Math.abs(thumbTipX - indexBaseX) > normalizedHandSize * 0.3

    return thumbUp && index && !middle && !ring && pinky
}