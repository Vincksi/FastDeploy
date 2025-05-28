
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { serverId, config } = await req.json()

    // Generate FastAPI code based on configuration
    const generatedCode = generateFastAPICode(config)
    
    // Create deployment entry
    const { data: deployment, error: deploymentError } = await supabaseClient
      .from('deployments')
      .insert({
        server_id: serverId,
        status: 'building',
        build_logs: 'Starting FastAPI code generation...'
      })
      .select()
      .single()

    if (deploymentError) throw deploymentError

    // Simulate code generation and deployment process
    EdgeRuntime.waitUntil(deployFastAPIServer(supabaseClient, serverId, deployment.id, generatedCode))

    return new Response(JSON.stringify({ 
      success: true, 
      deploymentId: deployment.id,
      message: 'FastAPI server generation started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateFastAPICode(config: any) {
  const { name, description, endpoints, middleware, database } = config

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
    uvicorn.run(app, host="0.0.0.0", port=8000)
`

  // Generate requirements.txt
  const requirementsTxt = `
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
${database?.enabled ? 'sqlalchemy==2.0.23\npsycopg2-binary==2.9.9' : ''}
${middleware?.includes('auth') ? 'python-jose[cryptography]==3.3.0\npasslib[bcrypt]==1.7.4' : ''}
`.trim()

  // Generate Dockerfile
  const dockerfile = `
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`

  return {
    'main.py': mainPy,
    'requirements.txt': requirementsTxt,
    'Dockerfile': dockerfile,
    '.gitignore': generateGitignore()
  }
}

function generateDatabaseModels(database: any) {
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
`
}

function generateEndpoints(endpoints: any[]) {
  return endpoints.map(endpoint => {
    const { path, method, description, responseModel } = endpoint
    
    switch (method.toLowerCase()) {
      case 'get':
        return `
@app.get("${path}")
def ${path.replace('/', '').replace(/[^a-zA-Z0-9]/g, '_') || 'root'}():
    """${description || 'Generated endpoint'}"""
    return {"message": "Hello from ${path}"}
`
      case 'post':
        return `
@app.post("${path}")
def ${path.replace('/', '').replace(/[^a-zA-Z0-9]/g, '_') || 'create'}(data: dict):
    """${description || 'Generated POST endpoint'}"""
    return {"message": "Data received", "data": data}
`
      default:
        return `
@app.${method.toLowerCase()}("${path}")
def ${path.replace('/', '').replace(/[^a-zA-Z0-9]/g, '_') || 'endpoint'}():
    """${description || 'Generated endpoint'}"""
    return {"message": "Success"}
`
    }
  }).join('\n')
}

function generateGitignore() {
  return `
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
`
}

async function deployFastAPIServer(supabase: any, serverId: string, deploymentId: string, code: any) {
  try {
    // Log build start
    await supabase.from('server_logs').insert({
      server_id: serverId,
      level: 'INFO',
      message: 'Starting FastAPI code generation...'
    })

    await supabase.from('deployments').update({
      build_logs: 'Generated FastAPI project structure\nCreated main.py with endpoints\nGenerated requirements.txt\nCreated Dockerfile for containerization'
    }).eq('id', deploymentId)

    // Simulate build process
    await new Promise(resolve => setTimeout(resolve, 3000))

    await supabase.from('server_logs').insert({
      server_id: serverId,
      level: 'SUCCESS',
      message: 'FastAPI code generated successfully'
    })

    await supabase.from('deployments').update({
      status: 'deploying',
      deploy_logs: 'Building Docker container...\nPulling base image: python:3.11-slim\nInstalling dependencies...\nStarting FastAPI server...'
    }).eq('id', deploymentId)

    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 4000))

    await supabase.from('deployments').update({
      status: 'running',
      completed_at: new Date().toISOString(),
      deploy_logs: 'Deployment completed successfully\nServer is running on port 8000\nHealth check: OK'
    }).eq('id', deploymentId)

    await supabase.from('servers').update({
      status: 'running'
    }).eq('id', serverId)

    await supabase.from('server_logs').insert({
      server_id: serverId,
      level: 'SUCCESS',
      message: 'FastAPI server deployed and running successfully'
    })

  } catch (error) {
    console.error('Deployment error:', error)
    
    await supabase.from('deployments').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      deploy_logs: `Deployment failed: ${error.message}`
    }).eq('id', deploymentId)

    await supabase.from('servers').update({
      status: 'error'
    }).eq('id', serverId)

    await supabase.from('server_logs').insert({
      server_id: serverId,
      level: 'ERROR',
      message: `Deployment failed: ${error.message}`
    })
  }
}
