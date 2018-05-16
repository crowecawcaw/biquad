import React, {Component} from 'react'
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip
} from 'recharts'
import biquad, {calculateParams, calculateFrequencyResponse} from './biquad'

import './App.css'

let lastStr = null
let lastArr = null
const extractNumbers = str => {
  if (str !== lastStr) {
    lastStr = str
    lastArr = (str.match(/[+-]?([0-9]*[.])?[0-9]+/g) || []).map(Number)
  }
  return lastArr
}

class App extends Component {
  state = {
    dataString: '',
    filterType: 'lpf',
    f0: 0.5,
    fs: 1,
    q: 0.707,
    order: 2
  }
  timeout = null
  componentDidMount() {
    if (localStorage.getItem('biquad-settings'))
      try {
        this.setState(JSON.parse(localStorage.getItem('biquad-settings')))
      } catch (e) {}
  }
  componentDidUpdate() {
    if (!this.timeout)
      this.timeout = setTimeout(() => {
        localStorage.setItem(
          'biquad-settings',
          JSON.stringify(this.state),
          1000
        )
        this.timeout = null
      })
  }
  render() {
    const params = calculateParams(this.state)
    const rawData = extractNumbers(this.state.dataString)
    const biquadData = biquad(rawData, params)
    const frequencyResponse = calculateFrequencyResponse(params).map(r => ({
      mag: r
    }))

    const lineData = rawData.map((r, i) => ({
      raw: rawData[i],
      biquad: biquadData[i]
    }))

    return (
      <div className="App">
        <div className="toolbar">
          <div className="page-title">Biquad</div>
          <div className="title">1. Paste Data</div>
          <textarea
            value={this.state.dataString}
            onChange={e => this.setState({dataString: e.target.value})}
          />
          <div className="title">2. Configure Filter</div>
          <div className="input-group">
            <div className="input-group-label">Filter Type</div>
            <div classname="input-group-input">
              <select
                value={this.state.filterType}
                onChange={e =>
                  this.setState({filterType: e.target.value, q: 0.707})
                }
              >
                <option value="lpf">Low Pass Filter</option>
                <option value="hpf">High Pass Filter</option>
                <option value="bpf1">Band Pass Filter 1</option>
                <option value="bpf2">Band Pass Filter 2</option>
                <option value="notch">Notch Filter</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <div className="input-group-label">
              Filter Order<span className="tooltip">
                <span className="icon" />
                <span className="text">
                  Higher order filters produce sharper filters. You will as many
                  biquad filters as half of the filter order.
                </span>
              </span>
            </div>
            <div classname="input-group-input">
              <input
                type="number"
                min={2}
                max={10}
                step={1}
                value={this.state.order}
                onChange={e =>
                  this.setState({order: parseFloat(e.target.value)})
                }
              />
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={this.state.order}
                onChange={e =>
                  this.setState({order: parseFloat(e.target.value)})
                }
              />
            </div>
          </div>
          <div className="input-group">
            <div className="input-group-label">Filter Frequency</div>
            <div classname="input-group-input">
              <input
                type="number"
                min={0}
                max={this.state.fs / 2}
                step={0.001}
                value={this.state.f0}
                onChange={e => this.setState({f0: parseFloat(e.target.value)})}
              />
              <br />
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.001}
                value={this.state.f0 / this.state.fs}
                onChange={e =>
                  this.setState({
                    f0: parseFloat(e.target.value) * this.state.fs
                  })
                }
              />
            </div>
          </div>
          <div className="input-group">
            <div className="input-group-label">Sampling Frequency</div>
            <div classname="input-group-input">
              <input
                type="number"
                value={this.state.fs}
                onChange={e => this.setState({fs: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <div className="input-group">
            <div className="input-group-label">
              Q<span className="tooltip">
                <span className="icon" />
                <span className="text">
                  The quality of the filter. Higher Q values give sharper
                  filters at the cost of ringing. A Q value of 0.707 gives the
                  sharpest filter with no ringing.
                </span>
              </span>
            </div>
            <div classname="input-group-input">
              <input
                type="number"
                min={0}
                max={5}
                step={0.01}
                value={this.state.order === 2 ? this.state.q : ' '}
                disabled={this.state.order !== 2}
                onChange={e => this.setState({q: parseFloat(e.target.value)})}
              />
              <br />
              <input
                type="range"
                min={0}
                max={5}
                step={0.01}
                value={this.state.q}
                disabled={this.state.order !== 2}
                onChange={e => this.setState({q: e.target.value})}
              />
            </div>
          </div>
          <div className="title">3. Get Coefficients</div>
          <div className="coefficients">
            {Array.isArray(params) ? (
              params.map((p, i) => (
                <table>
                  <thead>
                    <tr colspan="2">
                      <td>
                        <pre>Stage {i + 1}</pre>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {'b0,b1,b2,a1,a2'.split(',').map(k => (
                      <tr>
                        <td>
                          <pre>{k}</pre>
                        </td>
                        <td>
                          <pre>{p[k].toFixed(4)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))
            ) : (
              <table>
                <tbody>
                  {'b0,b1,b2,a1,a2'.split(',').map(k => (
                    <tr>
                      <td>
                        <pre>{k}</pre>
                      </td>
                      <td>
                        <pre>{params[k].toFixed(4)}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="charts">
          <ResponsiveContainer
            height={500}
            width="100%"
            minWidth={400}
            minHeight={500}
          >
            <LineChart
              data={lineData}
              margin={{top: 5, right: 30, bottom: 30, left: 30}}
            >
              <XAxis
                label={{
                  value: 'Sample Number',
                  position: 'bottom'
                }}
              />
              <YAxis
                label={{
                  value: 'Value',
                  angle: -90,
                  position: 'left'
                }}
                allowDataOverflow
                tickFormatter={t => t.toPrecision(3)}
              />
              <Line
                dataKey="raw"
                name="Input Data"
                dot={false}
                animationDuration={300}
                className="raw-data-line"
              />
              <Line
                dataKey="biquad"
                name="Filtered Data"
                dot={false}
                animationDuration={300}
                className="filtered-data-line"
              />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer
            height={500}
            width="100%"
            minWidth={400}
            minHeight={500}
          >
            <LineChart
              data={frequencyResponse}
              margin={{top: 5, right: 30, bottom: 30, left: 30}}
            >
              <XAxis
                tickFormatter={t => t / 300 * (this.state.fs / 2)}
                label={{
                  value: 'Frequency',
                  position: 'bottom'
                }}
              />
              <YAxis
                domain={[-60, 10]}
                ticks={[-60, -50, -40, -30, -20, -10, 0, 10]}
                label={{
                  value: 'Response (dB)',
                  angle: -90,
                  position: 'left'
                }}
                allowDataOverflow
              />
              <Line
                dataKey="mag"
                name="dB"
                dot={false}
                animationDuration={300}
                className="raw-data-line"
              />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }
}

export default App
