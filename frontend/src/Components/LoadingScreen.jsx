import Loading from '../adrawn/AnimationScreen.gif'
import { HashLoader } from 'react-spinners'

function LoadingScreen({ show }) {
    return (
        <div
            className={`fixed inset-0 z-[9999] flex  justify-center items-center bg-black transition-opacity duration-100 ${show ? 'opacity-100' : 'opacity-0'}`}>
            <img
                className='absolute inset-0 w-full h-full object-cover z-0'
                src={Loading}
                alt='Loading'
            />

            <HashLoader color='#A3B18A' size={100} />
        </div>
    )
}

export default LoadingScreen