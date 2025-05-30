import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConfigFile {
  name: string;
  content: string;
  language: string;
}

export const useConfigurationFiles = () => {
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateConfigFiles = (config: any): ConfigFile[] => {
    const { name, description, port = 8000, endpoints, middleware, database } = config;

    // Generate main.py
    const mainPy = `
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
${database?.enabled ? 'from sqlalchemy import create_engine, Column, Integer, String, DateTime\nfrom sqlalchemy.ext.declarative import declarative_base\nfrom sqlalchemy.orm import sessionmaker, Session\nfrom datetime import datetime' : ''}

app = FastAPI(
    title="${name}",
    description="${description || 'Auto-generated FastAPI server'}",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

${database?.enabled ? generateDatabaseModels(database) : ''}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "${name}"}

${generateEndpoints(endpoints || [])}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=${port})
`.trim();

    // Generate requirements.txt
    const requirementsTxt = `
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
${database?.enabled ? 'sqlalchemy==2.0.23\npsycopg2-binary==2.9.9' : ''}
${middleware?.includes('auth') ? 'python-jose[cryptography]==3.3.0\npasslib[bcrypt]==1.7.4' : ''}
`.trim();

    // Generate Dockerfile
    const dockerfile = `
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE ${port}

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${port}"]
`.trim();

    const gitignore = `
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/
.idea/
.vscode/
*.db
`.trim();

    return [
      { name: 'main.py', content: mainPy, language: 'python' },
      { name: 'requirements.txt', content: requirementsTxt, language: 'text' },
      { name: 'Dockerfile', content: dockerfile, language: 'dockerfile' },
      { name: '.gitignore', content: gitignore, language: 'text' }
    ];
  };

  const generateDatabaseModels = (database: any) => {
    return `
# Database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class ItemCreate(BaseModel):
    name: str
    description: str = None

class ItemResponse(BaseModel):
    id: int
    name: str
    description: str = None
    created_at: datetime

    class Config:
        from_attributes = True
`;
  };

  const generateEndpoints = (endpoints: any[]) => {
    return endpoints.map(endpoint => {
      const { path, method, description } = endpoint;
      
      switch (method.toLowerCase()) {
        case 'get':
          return `
@app.get("${path}")
def ${path.replace('/', '').replace(/[^a-zA-Z0-9]/g, '_') || 'root'}():
    """${description || 'Generated endpoint'}"""
    return {"message": "Hello from ${path}"}
`;
        case 'post':
          return `
@app.post("${path}")
def ${path.replace('/', '').replace(/[^a-zA-Z0-9]/g, '_') || 'create'}(data: dict):
    """${description || 'Generated POST endpoint'}"""
    return {"message": "Data received", "data": data}
`;
        default:
          return `
@app.${method.toLowerCase()}("${path}")
def ${path.replace('/', '').replace(/[^a-zA-Z0-9]/g, '_') || 'endpoint'}():
    """${description || 'Generated endpoint'}"""
    return {"message": "Success"}
`;
      }
    }).join('\n');
  };

  return { generateConfigFiles, configFiles, loading };
};
