
import React from 'react';

const FloatingCodeSnippets = () => {
  const codeSnippets = [
    'from fastapi import FastAPI',
    'app = FastAPI()',
    '@app.get("/api/users")',
    'async def get_users():',
    'return {"users": []}',
    'uvicorn.run(app, host="0.0.0.0")',
    'pip install fastapi uvicorn',
    'docker run -p 8000:8000',
    'from pydantic import BaseModel',
    'class User(BaseModel):',
    'name: str',
    'email: str',
    'response_model=List[User]',
    'status_code=201',
    'dependencies=[Depends(auth)]',
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {codeSnippets.map((snippet, index) => (
        <div
          key={index}
          className="floating-code"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${4 + Math.random() * 2}s`,
          }}
        >
          <span className="font-mono text-cyber-primary/30 bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
            {snippet}
          </span>
        </div>
      ))}
      
      {/* Floating logos */}
      <div className="absolute top-20 right-20 animate-float">
        <div className="w-16 h-16 bg-gradient-to-br from-cyber-primary/20 to-cyber-secondary/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-cyber-primary/30">
          <span className="text-2xl font-bold text-cyber-primary">🐍</span>
        </div>
      </div>
      
      <div className="absolute bottom-32 left-16 animate-float" style={{ animationDelay: '1s' }}>
        <div className="w-14 h-14 bg-gradient-to-br from-cyber-secondary/20 to-cyber-tertiary/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-cyber-secondary/30">
          <span className="text-xl font-bold text-cyber-secondary">🐳</span>
        </div>
      </div>
      
      <div className="absolute top-1/2 left-8 animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-12 h-12 bg-gradient-to-br from-cyber-tertiary/20 to-cyber-primary/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-cyber-tertiary/30">
          <span className="text-lg font-bold text-cyber-tertiary">⚡</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingCodeSnippets;
