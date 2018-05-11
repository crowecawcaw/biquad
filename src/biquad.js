const cos = Math.cos
const sin = Math.sin
const sqrt = Math.sqrt
const pi = Math.PI

export default (x, {b0, b1, b2, a1, a2}) => {
  const y = new Array(x.length)
  for (let n = 0; n < x.length; n++)
    y[n] =
      b0 * x[n] +
      b1 * (x[n - 1] || 0) +
      b2 * (x[n - 2] || 0) -
      a1 * (y[n - 1] || 0) -
      a2 * (y[n - 2] || 0)
  return y
}

export const calculateParams = ({filterType, q, f0, fs}) => {
  const w0 = 2 * pi * f0 / fs
  const alpha = sin(w0) / (2 * q)
  let params
  switch (filterType) {
    case 'lpf':
      params = {
        b0: (1 - cos(w0)) / 2,
        b1: 1 - cos(w0),
        b2: (1 - cos(w0)) / 2,
        a0: 1 + alpha,
        a1: -2 * cos(w0),
        a2: 1 - alpha
      }
      break
    case 'hpf':
      params = {
        b0: (1 + cos(w0)) / 2,
        b1: -(1 + cos(w0)),
        b2: (1 + cos(w0)) / 2,
        a0: 1 + alpha,
        a1: -2 * cos(w0),
        a2: 1 - alpha
      }
      break
    case 'bpf1':
      params = {
        b0: sin(w0) / 2,
        b1: 0,
        b2: -sin(w0) / 2,
        a0: 1 + alpha,
        a1: -2 * cos(w0),
        a2: 1 - alpha
      }
      break
    case 'bpf2':
      params = {
        b0: alpha,
        b1: 0,
        b2: -alpha,
        a0: 1 + alpha,
        a1: -2 * cos(w0),
        a2: 1 - alpha
      }
      break
    case 'notch':
      params = {
        b0: 1,
        b1: -2 * cos(w0),
        b2: 1,
        a0: 1 + alpha,
        a1: -2 * cos(w0),
        a2: 1 - alpha
      }
      break
    default:
      params = {
        b0: 1,
        b1: 0,
        b2: 0,
        a0: 1,
        a1: 0,
        a2: 0
      }
      break
  }
  //normalize the parameters
  return {
    b0: params.b0 / params.a0,
    b1: params.b1 / params.a0,
    b2: params.b2 / params.a0,
    a1: params.a1 / params.a0,
    a2: params.a2 / params.a0
  }
}

export const calculateFrequencyResponse = ({b0, b1, b2, a1, a2}) => {
  const response = new Array(101)
  for (let i = 0; i < 101; i++) {
    const w = pi * (i / 100)
    const phi = Math.pow(Math.sin(w / 2), 2)
    let y =
      Math.log(
        Math.pow(b0 + b1 + b2, 2) -
          4 * (b0 * b1 + 4 * b0 * b2 + b1 * b2) * phi +
          16 * b0 * b2 * phi * phi
      ) -
      Math.log(
        Math.pow(1 + a1 + a2, 2) -
          4 * (a1 + 4 * a2 + a1 * a2) * phi +
          16 * a2 * phi * phi
      )
    y = y * 10 / Math.LN10
    if (y == -Infinity) y = -200

    const mag = sqrt(
      (b0 ** 2 +
        b1 ** 2 +
        b2 ** 2 +
        2 * (b0 * b1) * cos(w) +
        2 * b0 * b2 * cos(2 * w)) /
        (1 +
          a1 ** 2 +
          a2 ** 2 +
          2 * (a1 + a1 * a2) * cos(w) +
          2 * a2 * cos(2 * w))
    )
    response[i] = {mag: y}
  }
  return response
}
