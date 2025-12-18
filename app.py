from flask import Flask, render_template, redirect, request, url_for,jsonify
from artwork import init_connection_engine, db,SavedArt,AdminUser
from flask_login import LoginManager, login_user, login_required
from sqlalchemy import select
from flask import request, redirect, url_for, flash
from werkzeug.utils import secure_filename
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_limiter.errors import RateLimitExceeded
from flask_bcrypt import Bcrypt
from datetime import datetime, date, timedelta, timezone
import uuid
import os
import re


# ---------- APP SETUP --------------
app = Flask(__name__)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://"
)

init_connection_engine(app)

UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'artwork')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------ HOME PAGE --------------
@app.route("/")
def home():
    artworks = db.session.execute(select(SavedArt)).scalars().all()
    return render_template("index.html", artworks = artworks)

# ------------ Flask Login Setup --------------------
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "userlogin"

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(AdminUser, int(user_id))

@app.errorhandler(RateLimitExceeded)
def ratelimit_handler(error):
    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
        return jsonify(error="ratelimit exceeded", description=str(error.description)), 429
    
    # flash("Too many requests. Please wait a moment and try again.", "danger")
    
    template = "index"
    if request.endpoint == "userlogin":
        template = "userlogin"
    elif request.endpoint == "register":
        template = "register"
    elif request.endpoint == "reset_password":
        template = "reset_password"
    
    return redirect(url_for(template))
# ---------------- Bcrypt Password Hashing ----------------
bcrypt = Bcrypt()
bcrypt.init_app(app)

# ------------------ ADMIN LOGIN ----------------------
@app.route("/userlogin", methods=["GET", "POST"])
@limiter.limit("10 per minute", methods=["POST"])
def userlogin():
    # Get the login info from the user
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        
        # If username or password not entered, redirect
        if not email or not password:
            flash("Error: enter both username and password", "danger")
            return redirect(url_for("userlogin"))
        
        # Retrieve the user from the database
        user = db.session.execute(select(AdminUser).where(AdminUser.email == email)).scalar()
        
        # Check for correct username and password, login user if both correct
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            flash(f"Welcome back {email}", "success")
            return redirect(url_for("home"))
        else:
            flash("Error: Incorrect email or password", "danger")
            return redirect(url_for("userlogin"))

    return render_template("login.html")

def check_password(password):
    reg = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#%()])[A-Za-z\d@$#%()]{6,20}$"
    
    pattern = re.compile(reg)
    
    is_valid = re.search(pattern, password)
    
    if is_valid:
        return True
    else:
        return False

# save uploaded image to static folder
@app.route("/upload", method = ['POST'])
@login_required
def upload_art():
    title = request.form.get('title')
    description = request.form.get('description')
    file = request.files.get('art_file')

    if file and file.filename != '':
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'],filename))

        #save to db
        new_entry = SavedArt (
            title = title,
            description = description,
            image = filename
        )
        db.session.add(new_entry)
        db.session.commit()

        return redirect(url_for('home'))
    return "Upload failed", 400

   
if __name__ == "__main__":
    app.run(debug=True)
