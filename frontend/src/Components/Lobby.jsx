import { useState, useEffect } from 'react';
import Camera from './Camera'





function useWindowWidth() {
const [size, setSize] = useState({
    width: window.innerWidth,
})

useEffect(() => {
    const handleResize = () => setSize({
    width: window.innerWidth,
    })

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
}, []);
return size
}





function Lobby() {
const { width } = useWindowWidth()
const mWidth = `${width * 0.6}px`


return (
    <div className='flex items-center justify-center color4 p-1 rounded-lg mt-5'>
        <div className='flex justify-center items-center color3 p-2 rounded-lg'>
            <div className='flex justify-center items-center color2 p-4 rounded-lg'>
                <Camera/>
            </div>
        </div>
    </div>
)
}

export default Lobby