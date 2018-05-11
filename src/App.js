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

const median = data => {
  const sorted = data.concat().sort((a, b) => a - b)
  return sorted[data.length >> 1]
}

class App extends Component {
  state = {dataString: '', filterType: 'lpf', f0: 0.5, fs: 1, q: 0.707}
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

    const rawData = (this.state.dataString.match(/\d+/g) || []).map(Number)
    const biquadData = biquad(rawData, params)

    const lineData = rawData.map((r, i) => ({
      raw: rawData[i],
      biquad: biquadData[i]
    }))

    const rawDomain = rawData.reduce(
      ([min, max], d) => [d < min ? d : min, d > max ? d : max],
      [rawData[0], rawData[0]]
    )
    const biquadMedian = median(biquadData)
    const domainHalfWidth = (rawDomain[1] - rawDomain[0]) / 2
    const biquadDomain = [
      biquadMedian - domainHalfWidth,
      biquadMedian + domainHalfWidth
    ]

    const frequencyResponse = calculateFrequencyResponse(params)

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
                  this.setState({f0: e.target.value * this.state.fs})
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
            <div className="input-group-label">Q</div>
            <div classname="input-group-input">
              <input
                type="number"
                min={0}
                max={5}
                step={0.01}
                value={this.state.q}
                onChange={e => this.setState({q: parseFloat(e.target.value)})}
              />
              <br />
              <input
                type="range"
                min={0}
                max={5}
                step={0.01}
                value={this.state.q}
                onChange={e => this.setState({q: e.target.value})}
              />
            </div>
          </div>

          <div className="title">3. Get Coefficients</div>
          <div className="coefficients">
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
          </div>
        </div>

        <div className="charts">
          <ResponsiveContainer
            height={500}
            width="100%"
            minWidth={400}
            minHeight={500}
          >
            <LineChart data={lineData}>
              <XAxis />
              <YAxis yAxisId="left" domain={rawDomain} allowDataOverflow />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={biquadDomain}
                allowDataOverflow
              />
              <Line
                dataKey="raw"
                yAxisId="left"
                name="Input Data"
                dot={false}
                animationDuration={300}
                className="raw-data-line"
              />
              <Line
                dataKey="biquad"
                name="Filtered Data"
                yAxisId="right"
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
            <LineChart data={frequencyResponse}>
              <XAxis />
              <YAxis yAxisId="left" domain={[-50, 'auto']} allowDataOverflow />
              <Line
                dataKey="mag"
                yAxisId="left"
                name="Magnitude"
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
