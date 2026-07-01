import NoCameraImage from '../adrawn/NoCameraImage.png'


function PlaceholderCam({ camWidth, camHeight }) {
    return (
        <div className='color4' style={{ width: camWidth, height: camHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', }}>
            <img className='w-2/3' src={NoCameraImage} alt='Im Dead'/>
        </div>
    )
}

export default PlaceholderCam   