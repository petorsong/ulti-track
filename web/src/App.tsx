import React from 'react';
import UserList from './components/UserList';
// import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <h1>My TypeScript App</h1>
        <UserList />
      </header>
    </div>
  );
}

export default App;
