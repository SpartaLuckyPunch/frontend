/* src/App.js */
import React from 'react';

function App() {
  return (
    <div className="app-container">
      <header style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
        <h3>내 모바일 웹앱 📱</h3>
      </header>
      
      <main style={{ padding: '20px' }}>
        <p>
          이제 데스크탑에서는 중앙에 위치하고,<br/>
          폰에서는 꽉 차게 보입니다!
        </p>
        <button style={{ 
            width: '100%', 
            padding: '15px', 
            backgroundColor: '#007aff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
          테스트 버튼
        </button>
      </main>
    </div>
  );
}

export default App;