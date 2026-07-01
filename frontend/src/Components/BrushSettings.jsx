import { useEffect, useState, useRef } from 'react'

import PaletteHeader from '../adrawn/PaletteHeader.png'

const colors = {
    red: '#e81416',
    orange: '#ffa500',
    yellow: '#faeb36',
    green: '#79c314',
    blue: '#487de7',
    purple: '#70369d',
    pink: '#ff69b4',
    brown: '#964b00',
    black: '#000000',
    white: '#ffffff',
}



function BrushSettings({ brushColor, setBrushColor, brushSize, setBrushSize, eraserSize, setEraserSize, camWidth, camHeight }) {
    // Size of the button
    const buttonDimension = camHeight / 10
    const panelWidth = camWidth * 0.2
    const sliderWidth = buttonDimension * 2.2



    // Helper functions to darken/lighten button colors
    function darkenHex(hex, amount = 40) {
        let color = hex.replace('#', '')

        let r = parseInt(color.substring(0, 2), 16)
        let g = parseInt(color.substring(2, 4), 16)
        let b = parseInt(color.substring(4, 6), 16)

        r = Math.max(0, r - amount)
        g = Math.max(0, g - amount)
        b = Math.max(0, b - amount)

        return `rgb(${r}, ${g}, ${b})`
    }

    function lightenHex(hex, amount = 40) {
        let color = hex.replace('#', '')

        let r = parseInt(color.substring(0, 2), 16)
        let g = parseInt(color.substring(2, 4), 16)
        let b = parseInt(color.substring(4, 6), 16)

        r = Math.min(255, r + amount)
        g = Math.min(255, g + amount)
        b = Math.min(255, b + amount)

        return `rgb(${r}, ${g}, ${b})`
    }

    function adjustHex(hex) {
        return hex === '#000000' ? lightenHex(hex) : darkenHex(hex)
    }



    return (
        <div className='flex flex-col justify-center items-center w-50'>
            <img className='w-2/3' src={PaletteHeader} alt='Palette'/>
            <div className='w-3/4 h-1 color6 rounded-full my-2'/>

            <div className='grid grid-cols-2 gap-2'>
                {Object.entries(colors).map(([ color, hexCode ]) => (
                    <button key={color} 
                        style={{ backgroundColor: brushColor === hexCode ? adjustHex(hexCode) : hexCode,
                                borderColor: adjustHex(hexCode),
                                width: buttonDimension* 1.2, 
                                height: buttonDimension
                            }} 
                        className='rounded-xl border-2'
                        onClick={() => {
                            setBrushColor(hexCode)
                        }}
                        />
                ))}
            </div>

            <div className='flex flex-row m-5' style={{ width: sliderWidth, minWidth: 0 }} >
                <input style={{ flex: 1, minWidth: 0, width: '100%' }} type='range' id='numericSlider' min='5' max='50' value={brushSize} onChange={(e) => {setBrushSize(Number(e.target.value))}}/>
            </div>

            <div className='flex flex-row mx-5' style={{ width: sliderWidth, minWidth: 0 }} >
                <input style={{ flex: 1, minWidth: 0, width: '100%'  }} type='range' id='numericSlider' min='5' max='50' value={eraserSize} onChange={(e) => {setEraserSize(Number(e.target.value))}}/>
            </div>

            <div className='w-3/4 h-1 color6 rounded-full mt-2'/>
        </div>
    )
}

export default BrushSettings