//http://www.musicdsp.org/files/Audio-EQ-Cookbook.txt
//http://www.earlevel.com/main/2016/09/29/cascading-filters/
//http://www.earlevel.com/main/2013/10/13/biquad-calculator-v2/
const cos = Math.cos
const sin = Math.sin
const pi = Math.PI

const biquad = (data, params) => {
  if (Array.isArray(params))
    return params.reduce((out, p) => biquad(out, p), data)

  const {b0, b1, b2, a1, a2} = params
  const pre = [data[0], data[0]]
  const x = pre.concat(data)
  const y = pre.concat(new Array(data.length))
  for (let n = 2; n < x.length; n++)
    y[n] =
      b0 * x[n] + b1 * x[n - 1] + b2 * x[n - 2] - a1 * y[n - 1] - a2 * y[n - 2]
  return y.slice(pre.length)
}
export default biquad

export const calculateParams = ({filterType, q, f0, fs, order}) => {
  if (order > 2) {
    let qs = []

    const pairs = order >> 1
    const oddPoles = order & 1
    const poleIncrement = pi / order
    let startAngle = poleIncrement

    if (!oddPoles) startAngle /= 2
    else qs.push(0.5)

    for (let i = 0; i < pairs; i++)
      qs.push(1 / (2 * cos(startAngle + i * poleIncrement)))

    return qs.map(calcQ =>
      calculateParams({filterType, q: calcQ, f0, fs, order: 2})
    )
  }

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

export const calculateFrequencyResponse = params => {
  if (Array.isArray(params))
    return params.reduce((out, p) => {
      const response = calculateFrequencyResponse(p)
      return response.map((r, i) => response[i] + out[i] || 0)
    }, [])

  const {b0, b1, b2, a1, a2} = params
  const response = new Array(301)
  for (let i = 0; i < 301; i++) {
    const w = pi * (i / 300)
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
    if (y === -Infinity) y = -200

    response[i] = y
  }
  return response
}
