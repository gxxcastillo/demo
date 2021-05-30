import React from 'react'
import Isomer from 'isomer'

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function convertCanvasToImage(canvasNode) {
    let image = new Image();
    image.src = canvasNode.toDataURL();
    return image;
  }


var iso;
export class Canvas extends React.Component {
    constructor(props) {
        super(props)
        this.containRef = React.createRef()
        this.canvasRef = React.createRef()
    }

    componentDidUpdate() {
        if (this.props.address) {
            const splitArr = this.props.address.split('x');
            const fortyChars = splitArr[1].toLowerCase();

            console.log('Canvas', 'fortyChars', fortyChars, fortyChars.length);

            const rgbArr = []
            for (let i = 0; i < fortyChars.length; i += 6) {
                if (i + 6 >= fortyChars.length) break
                rgbArr.push(hexToRgb(fortyChars.substring(i, i + 6)));
            }

            console.log('Canvas', 'rgbArr', rgbArr);

            iso = new Isomer(this.canvasRef.current);
            const cube = Isomer.Shape.Prism(Isomer.Point.ORIGIN).scale(Isomer.Point.ORIGIN, 2.5, 2.5, 0.3)
            let i = -1.2
            for (let color of rgbArr) {
                const isoColor = new Isomer.Color(color.r, color.g, color.b)
                iso.add(cube.translate(0, 0, i), isoColor)
                i = i + 0.6
            }

            const pngImage = convertCanvasToImage(this.canvasRef.current)
            const container = this.containRef.current
            console.log('images', container.childNodes.length)
            if (container.childNodes.length > 1) {
                container.replaceChild(pngImage, container.childNodes[1])
            } else {
                container.appendChild(pngImage)
            }
        }
    }

    render() {
        return (
            <div ref={this.containRef}>
                <canvas ref={this.canvasRef} width="256" height="256" style={{ visibility: 'hidden', display: 'none' }} />
            </div>
        );
    }
}

export default Canvas;