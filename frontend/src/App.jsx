import { useState } from 'react'
import './App.css'
import LinkedInOutreachTool from './LinkedInOutreachTool'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <LinkedInOutreachTool/>
    </div>
  )
}

export default App
