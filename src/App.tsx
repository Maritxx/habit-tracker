import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
    const categories = [
        'daily habits',
        'wellness',
        'learning',
        'play time',
    ]
    const habits = [
        {
            category: 'daily habits',
            name: 'Wake up early',
        },
        {
            category: 'daily habits',
            name: 'Cook lunch',
        },
        {
            category: 'daily habits',
            name: 'Journal',
        },
        {
            category: 'wellness',
            name: 'Meditate',
        },
        {
            category: 'learning',
            name: 'Read books',
        },
    ]

  return (
    <div className="App">
        {categories.map(category => <div>{category}</div>)}
    </div>
  )
}

export default App

/**
 * list out the hardcoded data
 * move the hardcoded data into the mock file
 * pretty up the landing page a bit
 * 
 * look into router/routing for react
 * start creating the settings page
 * begin shifting from mock to localStorage
 */
