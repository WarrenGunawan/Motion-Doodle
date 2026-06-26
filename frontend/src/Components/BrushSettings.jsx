import { useEffect, useState, useRef } from 'react'

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
    const buttonDimension = camHeight / 8
    const panelWidth = camWidth * 0.2



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
        <div className='flex flex-col justify-center items-center color3 py-5 px-3'>
            <div className='grid grid-cols-2 gap-2'>
                {Object.entries(colors).map(([ color, hexCode ]) => (
                    <button key={color} 
                        style={{ backgroundColor: brushColor === hexCode ? adjustHex(hexCode) : hexCode,
                                borderColor: adjustHex(hexCode),
                                width: buttonDimension, 
                                height: buttonDimension
                            }} 
                        className='rounded border-2'
                        onClick={() => {
                            setBrushColor(hexCode)
                        }}
                        />
                ))}
            </div>

            <div className='flex flex-row mx-5' style={{ width: panelWidth, minWidth: 0 }} >
                <p>{brushSize}</p>
                <input style={{ marginLeft: 5, flex: 1, minWidth: 0, width: '100%' }} type='range' id='numericSlider' min='5' max='50' value={brushSize} onChange={(e) => {setBrushSize(Number(e.target.value))}}/>
            </div>

            <div className='flex flex-row mx-5' style={{ width: panelWidth, minWidth: 0 }} >
                <p>{eraserSize}</p>
                <input style={{ marginLeft: 5, flex: 1, minWidth: 0, width: '100%'  }} type='range' id='numericSlider' min='5' max='50' value={eraserSize} onChange={(e) => {setEraserSize(Number(e.target.value))}}/>
            </div>
        </div>
    )
}

export default BrushSettings