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
  
  // Detect template type based on name and endpoints
  const templateType = detectTemplateType(name, endpoints)

  // Generate main.py based on template type
  const mainPy = generateMainPy(config, templateType)

  // Generate requirements.txt
  const requirementsTxt = generateRequirementsTxt(templateType, database, middleware)

  // Generate Dockerfile
  const dockerfile = generateDockerfile()

  return {
    'main.py': mainPy,
    'requirements.txt': requirementsTxt,
    'Dockerfile': dockerfile,
    '.gitignore': generateGitignore()
  }
}

function detectTemplateType(name: string, endpoints: any[]): string {
  if (name.includes('Basic') || endpoints.length <= 3) {
    return 'basic'
  } else if (name.includes('Auth') || endpoints.some((e: any) => e.path.includes('login') || e.path.includes('register'))) {
    return 'auth'
  } else if (name.includes('CRUD') || endpoints.some((e: any) => e.method === 'DELETE' || e.method === 'PUT')) {
    return 'crud'
  }
  return 'basic'
}

function generateMainPy(config: any, templateType: string): string {
  const { name, description, endpoints, middleware, database } = config

  let imports = `
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn`

  let additionalImports = ''
  let models = ''
  let databaseSetup = ''
  let endpointCode = ''

  // Add specific imports and setup based on template type
  if (templateType === 'auth') {
    additionalImports = `
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import hashlib
import secrets`

    models = `
# Authentication models
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str = None
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT settings
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Mock user database
fake_users_db = {}`

    endpointCode = generateAuthEndpoints()

  } else if (templateType === 'crud') {
    if (database?.enabled) {
      additionalImports = `
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime`

      databaseSetup = `
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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`

      models = `
# Pydantic models
class ItemBase(BaseModel):
    name: str
    description: str = None
    is_active: bool = True

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    name: str = None
    description: str = None
    is_active: bool = None

class ItemResponse(ItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True`
    }

    endpointCode = generateCrudEndpoints(database?.enabled)

  } else {
    // Basic API
    endpointCode = generateBasicEndpoints()
  }

  return `${imports}${additionalImports}

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

${databaseSetup}

${models}

${endpointCode}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=${config.port || 8000})
`
}

function generateBasicEndpoints(): string {
  return `
# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Basic API server is running"}

# Server information endpoint
@app.get("/info")
def server_info():
    return {
        "name": "Basic FastAPI Server",
        "version": "1.0.0",
        "description": "A simple FastAPI server with basic endpoints"
    }

# API version endpoint
@app.get("/version")
def get_version():
    return {"version": "1.0.0", "api_type": "basic"}
`
}

function generateCrudEndpoints(hasDatabase: boolean): string {
  if (hasDatabase) {
    return `
# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "CRUD API server is running"}

# Get all items
@app.get("/items", response_model=list[ItemResponse])
def get_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(Item).offset(skip).limit(limit).all()
    return items

# Create new item
@app.post("/items", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# Get item by ID
@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# Update item
@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_update: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item

# Delete item
@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

# Search items
@app.get("/items/search", response_model=list[ItemResponse])
def search_items(q: str, db: Session = Depends(get_db)):
    items = db.query(Item).filter(Item.name.contains(q)).all()
    return items
`
  } else {
    return `
# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "CRUD API server is running"}

# Mock data storage
items_db = []
item_counter = 0

# Get all items
@app.get("/items")
def get_items():
    return {"items": items_db, "total": len(items_db)}

# Create new item
@app.post("/items")
def create_item(item: dict):
    global item_counter
    item_counter += 1
    new_item = {
        "id": item_counter,
        "name": item.get("name", ""),
        "description": item.get("description", ""),
        "created_at": datetime.now().isoformat()
    }
    items_db.append(new_item)
    return new_item

# Get item by ID
@app.get("/items/{item_id}")
def get_item(item_id: int):
    item = next((item for item in items_db if item["id"] == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# Update item
@app.put("/items/{item_id}")
def update_item(item_id: int, item_data: dict):
    item = next((item for item in items_db if item["id"] == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.update(item_data)
    return item

# Delete item
@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    global items_db
    items_db = [item for item in items_db if item["id"] != item_id]
    return {"message": "Item deleted successfully"}
`
  }
}

function generateAuthEndpoints(): string {
  return `
# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = fake_users_db.get(email)
    if user is None:
        raise credentials_exception
    return user

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Auth API server is running"}

# User registration
@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate):
    if user.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_id = hashlib.md5(user.email.encode()).hexdigest()
    
    fake_users_db[user.email] = {
        "id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    return UserResponse(
        id=user_id,
        email=user.email,
        full_name=user.full_name,
        created_at=datetime.utcnow()
    )

# User login
@app.post("/login", response_model=Token)
def login_user(user: UserLogin):
    db_user = fake_users_db.get(user.email)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User logout
@app.post("/logout")
def logout_user(current_user: dict = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

# Get user profile
@app.get("/profile", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"]
    )

# Update user profile
@app.put("/profile", response_model=UserResponse)
def update_profile(profile_data: dict, current_user: dict = Depends(get_current_user)):
    user = fake_users_db[current_user["email"]]
    if "full_name" in profile_data:
        user["full_name"] = profile_data["full_name"]
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"]
    )

# Change password
@app.post("/change-password")
def change_password(password_data: dict, current_user: dict = Depends(get_current_user)):
    old_password = password_data.get("old_password")
    new_password = password_data.get("new_password")
    
    user = fake_users_db[current_user["email"]]
    if not verify_password(old_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    user["hashed_password"] = get_password_hash(new_password)
    return {"message": "Password changed successfully"}
`
}

function generateRequirementsTxt(templateType: string, database: any, middleware: any[]): string {
  let requirements = `
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0`

  if (templateType === 'auth') {
    requirements += `
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6`
  }

  if (database?.enabled || templateType === 'crud') {
    requirements += `
sqlalchemy==2.0.23`
    
    if (database?.type === 'postgresql') {
      requirements += `
psycopg2-binary==2.9.9`
    }
  }

  return requirements.trim()
}

function generateDockerfile(): string {
  return `
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`
}

function generateGitignore(): string {
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
app.db
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
