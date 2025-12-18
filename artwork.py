from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import String, Integer, Text
from flask_login import UserMixin


load_dotenv()
db = SQLAlchemy()

def init_connection_engine(app):
    # Detect whether app is running on PythonAnywhere
    hostname = os.uname().nodename if hasattr(os, "uname") else ""
    on_pythonanywhere = (
        "PYTHONANYWHERE_DOMAIN" in os.environ
        or "pythonanywhere" in hostname.lower()
        or "pythonanywhere" in os.getcwd().lower()
    )

    if on_pythonanywhere:
        print("Using PythonAnywhere MySQL database")
        db_user = os.getenv("PA_DB_USER")
        db_password = os.getenv("PA_DB_PASSWORD")
        db_name = os.getenv("PA_DB_NAME")
        db_host = os.getenv("PA_DB_HOST")
    else:
        print("Using local MySQL database")
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        db_name = os.getenv("DB_NAME")
        db_host = os.getenv("DB_HOST")

    # Build URI and print it (password masked)
    db_uri = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}"
    masked_uri = db_uri.replace(db_password, "*****") if db_password else db_uri
    print(f"Database URI: {masked_uri}")

    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        try:
            db.engine.connect()
            print("database connected successfully.")
        except OperationalError as e:
            print("database connection failed:", e)


class SavedArt(db.Model):
    __tablename__ = "saved_art"

    title: Mapped[str] = mapped_column(String(400), nullable=True)
    image: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)

class AdminUser(db.Model, UserMixin):
    __tablename__ = "admin_user"
    
    admin_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(128), nullable=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    
    
    def get_id(self):
        return f"manual_{self.admin_id}"