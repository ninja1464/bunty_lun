BACKGROUND_COLOR = "#000000";

const LINE_COLOR = "#FFFFFF";
//const LINE_COLOR = "#FF3131";
const LINE_WIDHT = 15;

var currentX = 0;
var currentY = 0;
var previousX = 0;
var previousY = 0;

var context;
var canvas;

function prepareCanvas() {
  canvas = document.getElementById("myCanvas");
  context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  context.strokeStyle = LINE_COLOR;
  context.lineWidth = LINE_WIDHT;
  context.lineJoin = "round";

  var isPainting = false;

  document.addEventListener("mousedown", function (event) {
    console.log("Mouse Pressed");
    isPainting = true;
    currentX = event.clientX - canvas.offsetLeft;
    currentY = event.clientY - canvas.offsetTop;
  });

  document.addEventListener("mousemove", function (event) {
    if (isPainting) {
      previousX = currentX;
      currentX = event.clientX - canvas.offsetLeft;

      previousY = currentY;
      currentY = event.clientY - canvas.offsetTop;

      Draw();
    }
  });

  document.addEventListener("mouseup", () => {
    console.log("Button was clicked!");
    isPainting = false;
  });

  canvas.addEventListener("mouseleave", () => {
    console.log("Button was clicked!");
    isPainting = false;
  });

  // touchpad
  document.addEventListener("touchstart", function (event) {
    console.log("Touchdown!");
    isPainting = true;
    currentX = event.touches[0].clientX - canvas.offsetLeft;
    currentY = event.touches[0].clientY - canvas.offsetTop;
  });

  document.addEventListener("touchmove", function (event) {
    if (isPainting) {
      previousX = currentX;
      currentX = event.touches[0].clientX - canvas.offsetLeft;

      previousY = currentY;
      currentY = event.touches[0].clientY - canvas.offsetTop;

      Draw();
    }
  });

  document.addEventListener("touchup", () => {
    console.log("Button was clicked!");
    isPainting = false;
  });

  canvas.addEventListener("touchleave", () => {
    console.log("Button was clicked!");
    isPainting = false;
  });
}

function Draw() {
  context.beginPath();
  context.moveTo(previousX, previousY);
  context.lineTo(currentX, currentY);
  context.closePath();
  context.stroke();
}

function clearCanvas() {
  currentX = 0;
  currentY = 0;
  previousX = 0;
  previousY = 0;

  context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function predictImage() {
  console.log("ss");
  let image = cv.imread(canvas);
  cv.cvtColor(image, image, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(image, image, 175, 255, cv.THRESH_BINARY);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(
    image,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_SIMPLE
  );

  let cnt = contours.get(0);
  let rect = cv.boundingRect(cnt);
  image = image.roi(rect);

  var height = image.rows;
  var width = image.cols;

  if (height > width) {
    height = 20;
    scalerFactor = image.rows / height;
    width = Math.round(image.cols / scalerFactor);
  } else {
    width = 20;
    scalerFactor = image.cols / width;
    height = Math.round(image.rows / scalerFactor);
  }

  let newSize = new cv.Size(width, height);
  cv.resize(image, image, newSize, 0, 0, cv.INTER_AREA);

  const LEFT = Math.ceil(4 + (20 - width) / 2);
  const RIGHT = Math.floor(4 + (20 - width) / 2);
  const TOP = Math.ceil(4 + (20 - height) / 2);
  const BOTTOM = Math.floor(4 + (20 - height) / 2);

  const BLACK = new cv.Scalar(0, 0, 0, 0);
  cv.copyMakeBorder(
    image,
    image,
    TOP,
    BOTTOM,
    LEFT,
    RIGHT,
    cv.BORDER_CONSTANT,
    BLACK
  );

  cv.findContours(
    image,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_SIMPLE
  );

  cnt = contours.get(0);
  const Moments = cv.moments(cnt, false);

  const cnx = Moments.m10 / Moments.m00;
  const cny = Moments.m01 / Moments.m00;
  // console.log(`M00: ${Moments.m00}, cx: ${cnx}, cy: ${cny}`);

  let shiftX = image.cols / 2 - cnx;
  let shiftY = image.rows / 2 - cny;

  // Define translation matrix
  let M = cv.matFromArray(2, 3, cv.CV_64F, [1, 0, shiftX, 0, 1, shiftY]);
  cv.warpAffine(
    image,
    image,
    M,
    new cv.Size(image.cols, image.rows),
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    BLACK
  );

  let pixelValues = image.data;
  // console.log(`pixelValues: ${pixelValues}`);

  pixelValues = Float32Array.from(pixelValues);
  pixelValues = pixelValues.map(function (item) {
    return item / 255.0;
  });

  const X = tf.tensor([pixelValues]);
  // console.log(`shape of tensor: ${X.shape}`);
  // console.log(`shape of tensor: ${X.dtype}`);

  // console.log(`scaled values: ${pixelValues}`);

  const result = model.predict(X);
  result.print();

  const output = result.argMax(1).dataSync()[0];

  // const outputCanvas = document.createElement("CANVAS");
  // cv.imshow(outputCanvas, image);
  // document.body.appendChild(outputCanvas);

  image.delete();
  contours.delete();
  hierarchy.delete();
  cnt.delete();
  M.delete();
  X.dispose();
  result.dispose();

  return output;
}
