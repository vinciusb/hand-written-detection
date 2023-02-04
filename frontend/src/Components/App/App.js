import React, { useEffect, useRef, useState } from "react";
import { render } from "react-dom";
import { Stage, Layer, Line, Text } from "react-konva";
import "./App.css";
// import * as tf from "tfjs";
const tf = require("@tensorflow/tfjs");

const CANVAS_SIZE = 140;
const IMAGE_SIZE = 28 * 28;

const App = () => {
    const stageRef = useRef(null);
    const [lines, setLines] = useState([]);
    const [imgData, setImageData] = useState(null);
    const [predicted, setPredicted] = useState("-");
    const [model, setModel] = useState(async () => {
        const model = await tf.loadLayersModel(
            `${window.location.origin}/model/model.json`
        );
        return model;
    });

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
            const context = canvas.getContext("2d", {
                willReadFrequently: true,
            });
            const image = new Image();

            image.addEventListener(
                "load",
                () => {
                    canvas.width = 28;
                    canvas.height = 28;

                    context.fillStyle = "white";
                    context.fillRect(0, 0, 28, 28);

                    context.scale(1, 1);
                    context.drawImage(image, 0, 0, 28, 28);
                    const unprocessed = tf.browser
                        .fromPixels(canvas)
                        .mean(2)
                        .toFloat()
                        .expandDims(-1)
                        .reshape([1, 784]);

                    const buffer = tf.buffer(
                        unprocessed.shape,
                        unprocessed.dtype,
                        unprocessed.dataSync()
                    );

                    for (let i = 0; i < buffer.values.length; i++) {
                        buffer.set(0xff & ~buffer.values[i], 0, i);
                    }
                    const finalTensor = buffer.toTensor();

                    resolve([context.getImageData(0, 0, 28, 28), finalTensor]);
                },
                false
            );
            image.src = URI;
        });
    }

    const handlePredict = async () => {
        const stage = stageRef.current.getStage();
        const dataURL = stage.toDataURL({ pixelRatio: 10 });
        convertURIToImageData(dataURL).then(([imgData, example]) => {
            setImageData(imgData);
            model.then((m) => {
                const predictions = m.predict(example);
                const tensor = tf.argMax(predictions, 1);

                setPredicted(
                    String.fromCharCode(
                        tensor.dataSync()[0] + "A".charCodeAt(0)
                    )
                );
            });
        });
    };

    return (
        <div className="app">
            <header>
                <h1>Upper case letter detector by Vinícius Braga Freire</h1>
                <h3>The ugliest (but functional) website I've ever done</h3>
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
                    <div style={{ display: "flex", flexFlow: "column" }}>
                        <h3>Draw here your letter</h3>
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
                    </div>

                    <h1
                        style={{
                            fontSize: "40px",
                            fontWeight: "bolder",
                            position: "relative",
                            bottom: "55px",
                            alignSelf: "end",
                        }}
                    >
                        →
                    </h1>
                    <div>
                        <h3>Reduced image</h3>
                        <div
                            className="bit-map"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: CANVAS_SIZE,
                                height: CANVAS_SIZE,
                            }}
                        >
                            <canvas
                                height={CANVAS_SIZE}
                                width={CANVAS_SIZE}
                                id="myCanvas"
                            />
                        </div>
                    </div>
                    <div style={{ marginLeft: "70px" }}>
                        <h3>Prediction</h3>
                        <div
                            className="predicted"
                            style={{
                                fontSize: "50px",
                                width: CANVAS_SIZE,
                                height: CANVAS_SIZE,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            {predicted}
                        </div>
                    </div>
                </div>
            </body>
        </div>
    );
};

export default App;
