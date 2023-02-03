import React, { useRef, useState } from "react";
import { render } from "react-dom";
import { Stage, Layer, Line, Text } from "react-konva";
import "./App.css";

const CANVAS_SIZE = 140;

const App = () => {
    const stageRef = useRef(null);
    const [lines, setLines] = useState([]);
    const [imgData, setImageData] = useState(null);

    const isDrawing = useRef(false);

    const handleMouseDown = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setLines([...lines, { points: [pos.x, pos.y] }]);
    };

    const handleMouseMove = (e) => {
        // no drawing - skipping
        if (!isDrawing.current) {
            return;
        }
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        const lastLine = lines[lines.length - 1];
        // add point
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        // replace last
        lines.splice(lines.length - 1, 1, lastLine);
        setLines(lines.concat());
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const handleClick = () => setLines([]);

    function convertURIToImageData(URI) {
        return new Promise((resolve, reject) => {
            if (URI == null) return reject();
            // const canvas = document.createElement("canvas");
            const canvas = document.getElementById("myCanvas");
            const context = canvas.getContext("2d");
            const image = new Image();
            image.addEventListener(
                "load",
                () => {
                    canvas.width = CANVAS_SIZE;
                    canvas.height = CANVAS_SIZE;
                    context.scale(28 / CANVAS_SIZE, 28 / CANVAS_SIZE);
                    context.drawImage(image, 0, 0);
                    resolve(
                        context.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
                    );
                },
                false
            );
            image.src = URI;
        });
    }

    const handlePredict = async () => {
        const stage = stageRef.current.getStage();
        const dataURL = stage.toDataURL({ pixelRatio: 3 });
        convertURIToImageData(dataURL).then((imgData) => {
            setImageData(imgData);
        });
    };

    return (
        <div className="app">
            <header>
                <h1>Letter detector</h1>
            </header>
            <body>
                <div className="buttons">
                    <div className="clean-bt" onClick={(e) => handleClick()}>
                        CLEAN
                    </div>
                    <div className="clean-bt" onClick={(e) => handlePredict()}>
                        PREDICT
                    </div>
                </div>
                <div className="work-area">
                    <Stage
                        ref={stageRef}
                        className="draw-area"
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        onMouseDown={handleMouseDown}
                        onMousemove={handleMouseMove}
                        onMouseup={handleMouseUp}
                    >
                        <Layer>
                            {lines.map((line, i) => (
                                <Line
                                    key={i}
                                    points={line.points}
                                    stroke="#000"
                                    strokeWidth={12}
                                    tension={0.5}
                                    lineCap="round"
                                    globalCompositeOperation={
                                        line.tool === "eraser"
                                            ? "destination-out"
                                            : "source-over"
                                    }
                                />
                            ))}
                        </Layer>
                    </Stage>
                    <h1 style={{ fontSize: "40px", fontWeight: "bolder" }}>
                        →
                    </h1>
                    <div
                        className="bit-map"
                        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                    >
                        <canvas id="myCanvas" />
                        {/* {imgData ? <img src={imgData} /> : null} */}
                    </div>
                    <div
                        className="predicted"
                        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                    />
                </div>
            </body>
        </div>
    );
};

export default App;
