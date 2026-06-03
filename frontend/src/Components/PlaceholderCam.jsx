function PlaceholderCam({ name, camWidth, camHeight }) {
    return (
        <div style={{ width: camWidth, height: camHeight, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>{name}</p>
        </div>
    )
}

export default PlaceholderCam   