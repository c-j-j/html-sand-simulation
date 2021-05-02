const canvas: HTMLCanvasElement = document.getElementById(
  "canvas"
) as HTMLCanvasElement;

const ctx: CanvasRenderingContext2D = canvas.getContext("2d");

const { width: w, height: h } = canvas;

const Elements = {
  air: [0, 0, 0],
  sand: [237, 201, 175],
  water: [0, 0, 255],
};

let imageData = ctx.createImageData(w, h);
let data = imageData.data;

function setupCanvas() {
  imageData = ctx.createImageData(w, h);
  data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = Elements.air;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

canvas.addEventListener("mousemove", (event: any) => {
  const x = event.layerX;
  const y = event.layerY;
  if (x > 0 && x < w && y > 0 && y < h) {
    addPoint({ x, y });
  }
});

let currentType = "sand";

document.getElementById("use-water").addEventListener("click", () => {
  console.log("SETTING WATER");
  currentType = "water";
});
document.getElementById("use-sand").addEventListener("click", () => {
  console.log("SETTING SAND");
  currentType = "sand";
});
document.getElementById("reset").addEventListener("click", () => {
  setupCanvas();
});

function addPoint({ x, y }) {
  const pos = (x + y * w) * 4;

  if (currentType === "sand") {
    const [r, g, b] = Elements.sand;
    data[pos] = r;
    data[pos + 1] = g;
    data[pos + 2] = b;
  }
  if (currentType === "water") {
    const [r, g, b] = Elements.water;
    data[pos] = r;
    data[pos + 1] = g;
    data[pos + 2] = b;
  }

  data[pos + 3] = 255;
}

function isSand(r: number, g: number, b: number) {
  const [sandR, sandB, sandG] = Elements.sand;

  return r === sandR && b === sandB && g === sandG;
}

function isAir(r: number, g: number, b: number) {
  const [sandR, sandB, sandG] = Elements.air;

  return r === sandR && b === sandB && g === sandG;
}

function isSandAtPoint(data: Uint8ClampedArray, i: number) {
  return isSand(data[i], data[i + 1], data[i + 2]);
}

function isAirAtPoint(data: Uint8ClampedArray, i: number) {
  return isAir(data[i], data[i + 1], data[i + 2]);
}

function setSand(data, i) {
  const [r, g, b] = Elements.sand;

  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
}

function setWater(data, i) {
  const [r, g, b] = Elements.water;

  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
}

function setBackground(data, i) {
  const [r, g, b] = Elements.air;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
}

type Colour = [number, number, number];

function arraysEqual(a: any[], b: any[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function getElementAtPoint(data, i): string {
  const el = [data[i], data[i + 1], data[i + 2]];

  for (let element of Object.keys(Elements)) {
    if (arraysEqual(el, Elements[element])) {
      return element;
    }
  }
  throw "No element at point";
}

function setSandAtNext(data: Uint8ClampedArray, i: number, nextI: number) {
  // sand at next layer, put sand on top
  const left = nextI - 4;
  const right = nextI + 4;
  if (isAirAtPoint(data, left)) {
    setSand(data, left);
  } else if (isAirAtPoint(data, right)) {
    setSand(data, right);
  } else {
    setSand(data, i);
  }
}

function setWaterAtNext(data: Uint8ClampedArray, i: number, nextI: number) {
  // sand at next layer, put sand on top
  const bottomLeft = nextI - 4;
  const bottomRight = nextI + 4;
  if (isAirAtPoint(data, bottomLeft)) {
    setWater(data, bottomLeft);
    setBackground(data, i);
  } else if (isAirAtPoint(data, bottomRight)) {
    setWater(data, bottomRight);
    setBackground(data, i);
  } else if (isAirAtPoint(data, i - 4)) {
    setWater(data, i - 4);
    setBackground(data, i);
  } else if (isAirAtPoint(data, i + 4)) {
    setWater(data, i + 4);
    setBackground(data, i);
  } else {
    setWater(data, i);
  }
}

function setElement(data: Uint8ClampedArray, i: number, nextI: number) {
  const el = getElementAtPoint(data, i);
  if (el === "sand") {
    setSandAtNext(data, i, nextI);
  } else if (el === "water") {
    setWaterAtNext(data, i, nextI);
  }
}

function draw() {
  for (let i = data.length - 4; i >= 0; i = i - 4) {
    const element = getElementAtPoint(data, i);
    if (element !== "air") {
      let nextI = i + w * 4;

      // final row - put sand at bottom of canvas
      if (nextI >= data.length) {
        setSand(data, i);
      } else {
        if (getElementAtPoint(data, nextI) !== "air") {
          // element cannot fall - needs to determine where to go
          setElement(data, i, nextI);
        } else {
          if (element === "sand") {
            setSand(data, nextI);
          } else if (element === "water") {
            setWater(data, nextI);
          }
          setBackground(data, i);
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

setupCanvas();
setInterval(draw, 5);
