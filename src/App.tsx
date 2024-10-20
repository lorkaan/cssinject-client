import React from 'react';
import logo from './logo.svg';
import './App.css';
import { CssLoad } from './CssLoad';

function App() {
  return (
    <div className="App">
      <CssLoad domain_str="testdomain"/>
      <p>There is alot</p>
    </div>
  );
}

export default App;
