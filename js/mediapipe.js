//below is the source used for rendering models
//https://threejs.org/docs/#examples/en/loaders/GLTFLoader

//below is the source for wrist recognition using mediapipe on web
//https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js

//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";



function Magnitude(v){
  return Math.sqrt(v['x']**2 + v['y']**2 + v['z']**2);
}

function GetUnitVector(v){
  let mag = Magnitude(v);
  let ans = {};
  ans['x'] = v['x']/mag
  ans['y'] = v['y']/mag
  ans['z'] = v['z']/mag
  return ans;
}


function crossProduct(a, b){
    let c = [ a['y'] * b['z'] - a['z'] * b['y'], a['z'] * b['x'] - a['x'] * b['z'], a['x'] * b['y'] - a['y'] * b['x'] ]
    let res = {}
    res['x'] = c[0]
    res['y'] = c[1]
    res['z'] = c[2]
    return res;
}

let objToRender = 'bracelet';

let predictedPoints = null;
let globalWidth = 0;
let globalHeight = 0;
let verticlePerspectiveAngle = 45;
let zDistanceOfScreenFromCamera = 13;
if(objToRender == 'golden_watch'){
  zDistanceOfScreenFromCamera = 16;
}


  
let maxVerticalY = 2* zDistanceOfScreenFromCamera*Math.tan(((verticlePerspectiveAngle/2) * Math.PI) / 180);
let maxVerticalX = maxVerticalY * (globalWidth/globalHeight);
let maxVerticalZ = maxVerticalX;


function RenderObject(width, height){
    
  //Create a Three.JS Scene
  const scene = new THREE.Scene();
  //create a new camera with positions and angles
  const camera = new THREE.PerspectiveCamera(verticlePerspectiveAngle, width / height, 0.1, 1000);

  //Keep track of the mouse position, so we can make the eye move
  let mouseX = width / 2;
  let mouseY = height / 2;
  globalWidth = width;
  globalHeight = height;

  //Keep the 3D object on a global variable so we can access it later
  let object;

  //OrbitControls allow the camera to move around the scene
  let controls;

  //Set which object to render

  //Instantiate a loader for the .gltf file
  const loader = new GLTFLoader();



  let sizeMultiplierValueElement = document.getElementById("sizeMultiplierValue");

  // for resizing 3d obj size using bounding box
  // resizing is not perfect for all models
  // https://discourse.threejs.org/t/unit-of-measurement-same-scale-for-all-3dmodels-in-three-js-scene-1-1-models-size-are-huge/44420/6
  let mat = new THREE.MeshLambertMaterial({
      color: 0xff0000
  });
  let sizeReductionConstant = 5;
  let boxGeom = new THREE.BoxGeometry(maxVerticalX/sizeReductionConstant, maxVerticalY/sizeReductionConstant, maxVerticalZ/sizeReductionConstant);
  let cube = new THREE.Mesh(boxGeom, mat);
  cube.name = 'newCUBE';
  cube.position.set(0, 0, 0)
  cube.scale.set(1, 1, 1);
  cube.material.fog = false
  // scene.current.add(cube);
  let mainBounds = new THREE.Box3().setFromObject(cube);
  console.log('main is >>>>>>>>', mainBounds);

  //Load the file
  loader.load(
    `models/${objToRender}/scene.gltf`,
    function (gltf) {
      //If the file is loaded, add it to the scene
      object = gltf.scene;
      
      let bbox = new THREE.Box3().setFromObject(gltf.scene);
                let helper = new THREE.Box3Helper(bbox, new THREE.Color(0xFF8551));
                let newBounds = new THREE.Box3().setFromObject(gltf.scene);
                console.log('newBounds is >>>>>>>>', newBounds);

      scene.add(object);

      let lengthSceneBounds = {
          x: Math.abs(mainBounds.max.x - mainBounds.min.x),
          y: Math.abs(mainBounds.max.y - mainBounds.min.y),
          z: Math.abs(mainBounds.max.z - mainBounds.min.z),
      };

      // Calculate side lengths of glb-model bounding box
      let lengthMeshBounds = {
          x: Math.abs(newBounds.max.x - newBounds.min.x),
          y: Math.abs(newBounds.max.y - newBounds.min.y),
          z: Math.abs(newBounds.max.z - newBounds.min.z),
      };

      // Calculate length ratios
      let lengthRatios = [
          (lengthSceneBounds.x / lengthMeshBounds.x),
          (lengthSceneBounds.y / lengthMeshBounds.y),
          (lengthSceneBounds.z / lengthMeshBounds.z),
      ];

      // Select smallest ratio in order to contain the model within the scene
      let minRatio = Math.min(...lengthRatios);

      // If you need some padding on the sides
      let padding = 0;
      minRatio -= padding;

      // changing min ration by user value
      let sizeMultiplier = parseFloat(sizeMultiplierValueElement.value);
      if(sizeMultiplier > 0){
        minRatio = minRatio * sizeMultiplier;
        
        // Use smallest ratio to scale the model
        object.children[0].scale.set(minRatio, minRatio, minRatio);
      }      

    },
    function (xhr) {
      //While it is loading, log the progress
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      //If there is an error, log it
      console.error(error);
    }
  );

  console.log(loader)

  // geometry.computeBoundingBox();
  
  // var centroid = new THREE.Vector3();
  // centroid.addVectors( geometry.boundingBox.min, geometry.boundingBox.max );
  // centroid.multiplyScalar( 0.5 );
  
  // centroid.applyMatrix4( mesh.matrixWorld );


  //Instantiate a new renderer and set its size
  const renderer = new THREE.WebGLRenderer({ alpha: true }); //Alpha: true allows for the transparent background
  renderer.localClippingEnabled = true
  renderer.setSize(width, height);

  //Add the renderer to the DOM
  document.getElementById("container3D").appendChild(renderer.domElement);

  //Set how far the camera will be from the 3D model
  // camera.position.z = objToRender === "golden_watch" ? 25 : 500;
  camera.position.z = zDistanceOfScreenFromCamera

  //Add lights to the scene, so we can actually see the 3D model
  const topLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
  topLight.position.set(10, 10, 0) //top-left-ish
  topLight.castShadow = true;
  scene.add(topLight);

  const rightLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
  rightLight.position.set(-10, -10, -0) //top-left-ish
  rightLight.castShadow = true;
  scene.add(rightLight);

  const ambientLight = new THREE.AmbientLight(0x333333, objToRender === "golden_watch" ? 1 : 1);
  scene.add( new THREE.AmbientLight( 0x222222 ) );
  scene.add(ambientLight);

  //This adds controls to the camera, so we can rotate / zoom it with the mouse
  if (objToRender === "golden_watch") {
    controls = new OrbitControls(camera, renderer.domElement);
  }

    
  maxVerticalY = 2* zDistanceOfScreenFromCamera*Math.tan(((verticlePerspectiveAngle/2) * Math.PI) / 180);
  maxVerticalX = maxVerticalY * (globalWidth/globalHeight);
  maxVerticalZ = maxVerticalX;
  
  // Define a custom shader material for the invisible wall
  const wallMaterial = new THREE.ShaderMaterial({
    transparent: true,
    vertexShader: `
        varying vec3 fragPosition;
        
        void main() {
            fragPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 fragPosition;
        
        void main() {
            // Set the condition to make everything behind the wall invisible
            if (fragPosition.z < 0.0) {
                discard;
            }
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent color
        }
    `
  });

  // Create a new mesh for the invisible wall
  const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(maxVerticalX, maxVerticalY), wallMaterial);

  // Position the wall mesh in the scene
  wallMesh.position.z = 0;

  // Add the wall mesh to the scene
  scene.add(wallMesh);

  //Render the scene
  function animate() {
    requestAnimationFrame(animate);
    //Here we could add some code to update the scene, adding some automatic movement

    //Make the eye move
    if (object && objToRender) {
      //I've played with the constants here until it looked good 
      // object.rotation.y = -3 + mouseX / width * 3;
      // object.rotation.x = -1.2 + mouseY * 2.5 / height;
      
      if(predictedPoints!==null){
        let wristNonPunchPointLandmark = predictedPoints[0];
        let wristPunchPointLandmark = predictedPoints[1];
        let bottomPointLandmark = predictedPoints[2];

        let yellowPoint = {x:(wristNonPunchPointLandmark.x + wristPunchPointLandmark.x)/2,
                           y:(wristNonPunchPointLandmark.y + wristPunchPointLandmark.y)/2,
                           z:(wristNonPunchPointLandmark.z + wristPunchPointLandmark.z)/2};
        
        let greenPoint = {x:(wristNonPunchPointLandmark.x),
                          y:(wristNonPunchPointLandmark.y),
                          z:(wristNonPunchPointLandmark.z),}
        let redPoint = {x:(wristPunchPointLandmark.x),
                        y:(wristPunchPointLandmark.y),
                        z:(wristPunchPointLandmark.z),}
        let bluePoint = {x:(bottomPointLandmark.x),
                         y:(bottomPointLandmark.y),
                         z:(bottomPointLandmark.z),}

        let centerOfScreen = {x:0.5, y:0.5, z:0};
        

        function translateAxis(v, origin){
          return {x:-(v.x-origin.x), y:-(v.y-origin.y), z:v.z-origin.z};
        }
        function ZeroOneToSized(v){
          return {x:v.x*maxVerticalX, y:v.y*maxVerticalY, z:v.z*maxVerticalZ};
        }

        function LandmarksToWorldPoints(v, origin){
          return ZeroOneToSized(translateAxis(v, origin));
        }

        yellowPoint = LandmarksToWorldPoints(yellowPoint, centerOfScreen);
        greenPoint = LandmarksToWorldPoints(greenPoint, centerOfScreen);
        redPoint = LandmarksToWorldPoints(redPoint, centerOfScreen);
        bluePoint = LandmarksToWorldPoints(bluePoint, centerOfScreen);

        object.position.x = yellowPoint.x;
        object.position.y = yellowPoint.y;

        let upVector = {x:bluePoint.x-yellowPoint.x, y:bluePoint.y-yellowPoint.y, z:bluePoint.z-yellowPoint.z}

        // normalizing z values of mediapipe
        // 1
        let matrix = new THREE.Matrix4().lookAt(
                    new THREE.Vector3(yellowPoint.x, yellowPoint.y, yellowPoint.z),
                    new THREE.Vector3(redPoint.x, redPoint.y, redPoint.z),
                    new THREE.Vector3(upVector.x, upVector.y, upVector.z));
        let targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);

        object.quaternion.rotateTowards(targetQuaternion, 10).normalize();

        
        // let defaultScale = 1;
        // let scaleMultiplier = distGreenRed/defaultScale;
        // if(zDIstByxDist > 1){
        //   object.children[0].scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
        // }

      }
      

      
    }
    // object.rotation.x = 0;
    renderer.render(scene, camera);
  }

  //Add a listener to the window, so we can resize the window and the camera
  window.addEventListener("resize", function () {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  //add mouse position listener, so we can make the eye move
  // document.onmousemove = (e) => {
  //   mouseX = e.clientX;
  //   mouseY = e.clientY;
  // }

  //Start the 3D rendering
  animate();
}


function FindObjectPoints(results, width, height){
  let index = 0;
  let isHandRight = 1;
  for(let i=0;i<results.handednesses.length;i++){
    if(results.handednesses[i]['categoryName'] == 'Left'){
      index = i;
      isHandRight = -1;
      break;
    }
  }
  let landmarks = results.landmarks[index];
  let bottomPoint = {};
  bottomPoint['x'] = landmarks[0].x;
  bottomPoint['y'] = landmarks[0].y;
  bottomPoint['z'] = landmarks[0].z;
  let indexPoint = {};
  indexPoint['x'] = landmarks[5].x;
  indexPoint['y'] = landmarks[5].y;
  indexPoint['z'] = landmarks[5].z;
  let littlePoint = {};
  littlePoint['x'] = landmarks[17].x;
  littlePoint['y'] = landmarks[17].y;
  littlePoint['z'] = landmarks[17].z;

  let zMultiplier = 1;
  bottomPoint.x *= width;
  bottomPoint.y *= height;
  bottomPoint.z *= width*zMultiplier;
  indexPoint.x *= width;
  indexPoint.y *= height;
  indexPoint.z *= width*zMultiplier;
  littlePoint.x *= width;
  littlePoint.y *= height;
  littlePoint.z *= width*zMultiplier;

  let BC = {};
  let BA = {};
  let CA = {};
  let DA = {};

  
  BA['x'] = indexPoint.x - bottomPoint.x
  BA['y'] = indexPoint.y - bottomPoint.y
  BA['z'] = indexPoint.z - bottomPoint.z
  CA['x'] = littlePoint.x - bottomPoint.x
  CA['y'] = littlePoint.y - bottomPoint.y
  CA['z'] = littlePoint.z - bottomPoint.z
  BC['x'] = indexPoint.x - littlePoint.x
  BC['y'] = indexPoint.y - littlePoint.y
  BC['z'] = indexPoint.z - littlePoint.z

  let unitBA = GetUnitVector(BA)
  let unitCA = GetUnitVector(CA)

  
  DA['x'] = -(unitBA['x'] + unitCA['x'])
  DA['y'] = -(unitBA['y'] + unitCA['y'])
  DA['z'] = -(unitBA['z'] + unitCA['z'])
  
  let unitDA = GetUnitVector(DA)
  let CAcrossBA = crossProduct(CA, BA)
  let unitCAcrossBA = GetUnitVector(CAcrossBA)

  
  let downwardDirecton = {};

  // pushing the yellow point into the wrist (tiny amount)
  // let angle = 30
  let angle = 0
  let mul = Math.tan(angle * (Math.PI/180)) * isHandRight;
  downwardDirecton['x'] = unitDA['x'] - (mul)*unitCAcrossBA['x']
  downwardDirecton['y'] = unitDA['y'] - (mul)*unitCAcrossBA['y']
  downwardDirecton['z'] = unitDA['z'] - (mul)*unitCAcrossBA['z']

  let yellow = {};
  let alpha = 0.5*Magnitude(BC)
  yellow['x'] = bottomPoint.x + alpha*downwardDirecton['x']
  yellow['y'] = bottomPoint.y + alpha*downwardDirecton['y']
  yellow['z'] = bottomPoint.z + alpha*downwardDirecton['z']


  let unitBC = GetUnitVector(BC)
  let sideways = {};

  // tilting the wrist line [NonPunchPoint down, PunchPoint up] (tiny amount)
  // let littleUp = 0.1
  let littleUp = 0.0
  sideways['x'] = unitBC['x'] + (littleUp)*unitDA['x']
  sideways['y'] = unitBC['y'] + (littleUp)*unitDA['y']
  sideways['z'] = unitBC['z'] + (littleUp)*unitDA['z']

  // shifting yellow a little towards nonPunchSide (tiny amount)
  let shift = 5
  yellow['x'] = yellow['x'] + shift*unitBC['x']
  yellow['y'] = yellow['y'] + shift*unitBC['y']
  yellow['z'] = yellow['z'] + shift*unitBC['z']

  
  // caluclating wristPunchPoint and wristNonPunchPoint using width respective BC
  let wristWidth = Magnitude(BC)*1
  let wristPunchPoint = {};
  wristPunchPoint['x'] = yellow['x'] - (wristWidth/2)*sideways['x']
  wristPunchPoint['y'] = yellow['y'] - (wristWidth/2)*sideways['y']
  wristPunchPoint['z'] = yellow['z'] - (wristWidth/2)*sideways['z']

  let wristNonPunchPoint = {};
  wristNonPunchPoint['x'] = yellow['x'] + (wristWidth/2)*sideways['x']
  wristNonPunchPoint['y'] = yellow['y'] + (wristWidth/2)*sideways['y']
  wristNonPunchPoint['z'] = yellow['z'] + (wristWidth/2)*sideways['z']

  let confidanceOfPoseEstimation = 0
  let predictionYellow2 = {};
  predictionYellow2['x'] = 0
  predictionYellow2['y'] = 0

  let wristNonPunchPointLandmark = {'x': wristNonPunchPoint['x']/width, 'y': wristNonPunchPoint['y']/height, 'z':wristNonPunchPoint['z']/width}
  let wristPunchPointLandmark = {'x': wristPunchPoint['x']/width, 'y': wristPunchPoint['y']/height, 'z':wristPunchPoint['z']/width}
  let bottomPointLandmark = {'x': bottomPoint['x']/width, 'y': bottomPoint['y']/height, 'z':bottomPoint['z']/width}

  // console.log(wristNonPunchPointLandmark);
  let data = [wristNonPunchPointLandmark,
              wristPunchPointLandmark,
              bottomPointLandmark,
              width, height, width,
              isHandRight,
              confidanceOfPoseEstimation,
              predictionYellow2['x'],
              predictionYellow2['y']]

  return data;
}




// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    HandLandmarker,
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
  
  const demosSection = document.getElementById("demos");
  
  let handLandmarker = undefined;
  let poseLandmarker = undefined;
  let runningMode = "IMAGE";
  let enableWebcamButton;
  let webcamRunning;
  let createdObjectRenderer = false;
  let once = 1;
  
  // Before we can use HandLandmarker class we must wait for it to finish
  // loading. Machine Learning models can be large and take a moment to
  // get everything needed to run.
  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numHands: 2
    });
    demosSection.classList.remove("invisible");
  };
  createHandLandmarker();
  const createPoseLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numPoses: 2
    });
    demosSection.classList.remove("invisible");
  };
  createPoseLandmarker();
  
  /********************************************************************
  // Demo 1: Grab a bunch of images from the page and detection them
  // upon click.
  ********************************************************************/
  
  // In this demo, we have put all our clickable images in divs with the
  // CSS class 'detectionOnClick'. Lets get all the elements that have
  // this class.
  const imageContainers = document.getElementsByClassName("detectOnClick");
  
  // Now let's go through all of these and add a click event listener.
  for (let i = 0; i < imageContainers.length; i++) {
    // Add event listener to the child element whichis the img element.
    imageContainers[i].children[0].addEventListener("click", handleClick);
  }
  
  // When an image is clicked, let's detect it and display results!
  async function handleClick(event) {
    if (!handLandmarker) {
      console.log("Wait for handLandmarker to load before clicking!");
      return;
    }
  
    if (runningMode === "VIDEO") {
      runningMode = "IMAGE";
      await handLandmarker.setOptions({ runningMode: "IMAGE" });
      await poseLandmarker.setOptions({ runningMode: "IMAGE" });
    }
    // Remove all landmarks drawed before
    const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
    for (var i = allCanvas.length - 1; i >= 0; i--) {
      const n = allCanvas[i];
      n.parentNode.removeChild(n);
    }
  
    // We can call handLandmarker.detect as many times as we like with
    // different image data each time. This returns a promise
    // which we wait to complete and then call a function to
    // print out the results of the prediction.
    const handLandmarkerResult = handLandmarker.detect(event.target);
    const poseLandmarkerResult = poseLandmarker.detect(event.target);
    // console.log(handLandmarkerResult.handednesses[0][0]);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("class", "canvas");
    canvas.setAttribute("width", event.target.naturalWidth + "px");
    canvas.setAttribute("height", event.target.naturalHeight + "px");
    canvas.style =
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      event.target.width +
      "px;" +
      "height: " +
      event.target.height +
      "px;";
  
    event.target.parentNode.appendChild(canvas);
    const cxt = canvas.getContext("2d");
    for (const landmarks of handLandmarkerResult.landmarks) {
      drawConnectors(cxt, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5
      });
      drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
    }
  }
  
  /********************************************************************
  // Demo 2: Continuously grab image from webcam stream and detect it.
  ********************************************************************/
  
  const video = document.getElementById("webcam");
  const canvasElement_mediapipe = document.getElementById("output_canvas");
  // canvasElement_mediapipe.style.backgroundColor = "rgba(0,0,0,0)"
  const canvasCtx = canvasElement_mediapipe.getContext("2d");

  const parent = document.getElementById("container3D");
  var childCanvasElements = parent.querySelectorAll('canvas');

  
  // Check if webcam access is supported.
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
  
  // If webcam supported, add event listener to button for when user
  // wants to activate it.
  if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
  } else {
    console.warn("getUserMedia() is not supported by your browser");
  }
  
  // Enable the live webcam view and start detection.
  function enableCam(event) {
    if (!handLandmarker) {
      console.log("Wait! objectDetector not loaded yet.");
      document.getElementById("instructionsBox").textContent = "Wait! objectDetector not loaded yet.";
      return;
    }
    document.getElementById("instructionsBox").textContent = "";
    if (webcamRunning === true) {
      webcamRunning = false;
      // enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    } else {
      webcamRunning = true;
      // enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }
  
    // getUsermedia parameters.
    const constraints = {
      video: true
    };
  
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
      video.addEventListener("loadeddata", predictWebcamPose);
    });
  }
  
  let lastVideoTime = -1;
  let results = undefined;
  
  function DrawDebugsOnCanvas(predictedPoints, canvasCtx, canvas){
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;

    // console.log(predictedPoints);
    let wristNonPunchPointLandmark = predictedPoints[0];
    let wristPunchPointLandmark = predictedPoints[1];
    let bottomPointLandmark = predictedPoints[2];

    canvasCtx.beginPath();
    canvasCtx.arc(wristNonPunchPointLandmark.x * canvasWidth, wristNonPunchPointLandmark.y * canvasHeight, 5, 0, 2 * Math.PI);
    canvasCtx.fillStyle = 'green'; // Change color as needed
    canvasCtx.fill();
    canvasCtx.closePath();

    // canvasCtx.beginPath();
    // canvasCtx.arc(0.5 * canvasWidth, 0.5 * canvasHeight, 50, 0, 2 * Math.PI);
    // canvasCtx.fillStyle = 'yellow'; // Change color as needed
    // canvasCtx.fill();
    // canvasCtx.closePath();
    
    canvasCtx.beginPath();
    canvasCtx.arc(wristPunchPointLandmark.x * canvasWidth, wristPunchPointLandmark.y * canvasHeight, 5, 0, 2 * Math.PI);
    canvasCtx.fillStyle = 'red'; // Change color as needed
    canvasCtx.fill();
    canvasCtx.closePath();
    
    canvasCtx.beginPath();
    canvasCtx.arc(bottomPointLandmark.x * canvasWidth, bottomPointLandmark.y * canvasHeight, 5, 0, 2 * Math.PI);
    canvasCtx.fillStyle = 'blue'; // Change color as needed
    canvasCtx.fill();
    canvasCtx.closePath();
  }

  async function predictWebcam() {
    let TransformObject = function(){}
    // childCanvasElements.forEach(function(canvas) {
    //     canvas.style.width = globalWidth;
    //     canvas.style.height = globalHeight;
    //     canvas.width = globalWidth;
    //     canvas.height = globalHeight;
    // });

    
    // childCanvasElements.forEach(function(canvas) {
    //   canvas.style.cssText = document.defaultView.getComputedStyle(canvasElement_mediapipe, "").cssText;
    // });
    if(createdObjectRenderer === false){
      
      TransformObject = RenderObject(video.videoWidth, video.videoHeight);
      createdObjectRenderer = true;
    }
    
    canvasElement_mediapipe.style.width = globalWidth;
    canvasElement_mediapipe.style.height = globalHeight;
    canvasElement_mediapipe.width = globalWidth;
    canvasElement_mediapipe.height = globalHeight;
    
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
      runningMode = "VIDEO";
      await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      results = handLandmarker.detectForVideo(video, startTimeMs);
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement_mediapipe.width, canvasElement_mediapipe.height);
    if (results.landmarks.length != 0) {
      for (const landmarks of results.landmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5
        });
        drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
      }
      predictedPoints = FindObjectPoints(results, globalWidth, globalHeight);
      DrawDebugsOnCanvas(predictedPoints, canvasCtx, canvasElement_mediapipe);
      // TransformObject(0,0,predictedPoints);
      // TransformObject(predictedPoints);
      // drawLandmarks(canvasCtx, [predictedPoints[0], predictedPoints[1], predictedPoints[2]], { color: "#FF0000", lineWidth: 2 });

    }
    canvasCtx.restore(results.landmarks);
  
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
  }

  let lastVideoTimePose = -1;
  async function predictWebcamPose() {
    canvasElement_mediapipe.style.height = video.videoHeight;
    video.style.height = video.videoHeight;
    canvasElement_mediapipe.style.width = video.videoWidth;
    video.style.width = video.videoWidth;
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
      runningMode = "VIDEO";
      await poseLandmarker.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTimePose !== video.currentTime) {
      lastVideoTimePose = video.currentTime;
      poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement_mediapipe.width, canvasElement_mediapipe.height);
        for (const landmark of result.landmarks) {
          drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
        }
        console.log(result);
        // let poseData = ProcessPoseResults(results);
        // DrawDebugsOnCanvasPose(poseData, canvasCtx, canvasElement_mediapipe);

        canvasCtx.restore();
      });
    }
  
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcamPose);
    }
  }
