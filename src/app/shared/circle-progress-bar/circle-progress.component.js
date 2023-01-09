import React from 'react'

const INITIAL_OFFSET = 25
const circleConfig = {
  viewBox: '0 0 38 37',
  x: '19',
  y: '19',
  radio: '15.91549430918954',
}

const CircleProgressBar = ({
  className,
  trailStrokeColor,
  strokeColor,
  percentage,
  innerText,
}) => {
  return (
    <figure className={`circle-container`}>
      <svg viewBox={circleConfig.viewBox}>
        <circle
          className="ring"
          cx={circleConfig.x}
          cy={circleConfig.y}
          r={circleConfig.radio}
          fill="transparent"
          stroke={trailStrokeColor}
          strokeWidth={2}
        />

        <circle
          className="path"
          cx={circleConfig.x}
          cy={circleConfig.y}
          r={circleConfig.radio}
          fill="transparent"
          stroke={strokeColor}
          strokeDasharray={`${percentage} ${100 - percentage}`}
          strokeDashoffset={INITIAL_OFFSET}
        />
        <g className="circle-label">
          <text x="50%" y="50%" className="circle-percentage">
            {percentage}%
          </text>
          <text x="50%" y="50%" className="circle-text">
            {innerText}
          </text>
        </g>
      </svg>
    </figure>
  )
}

export default CircleProgressBar