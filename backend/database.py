from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from models.database_models import Base
from config import Config
import os

# Create database engine
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'land_price_prediction.db')
DATABASE_URL = f'sqlite:///{DATABASE_PATH}'

engine = create_engine(
    DATABASE_URL,
    connect_args={'check_same_thread': False},  # Needed for SQLite
    echo=Config.DEBUG  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create scoped session for thread safety
db_session = scoped_session(SessionLocal)

def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print(f"✅ Database initialized at: {DATABASE_PATH}")

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database on import
init_db()
