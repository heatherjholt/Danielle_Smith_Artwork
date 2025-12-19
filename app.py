from flask import Flask, render_template, redirect, request, url_for,jsonify
from artwork import init_connection_engine, db,SavedArt,AdminUser, AboutPage
from flask_login import LoginManager, login_user, login_required, logout_user
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
from dotenv import load_dotenv
load_dotenv()

# ---------- APP SETUP --------------
app = Flask(__name__)

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

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

# ------------ ROUTES --------------
@app.route("/")
def home():
    artworks = db.session.execute(select(SavedArt).order_by(SavedArt.position.asc(), SavedArt.saved_id.asc())).scalars().all()
    return render_template("index.html", artworks = artworks)

@app.route("/admin")
@login_required
def admin_dashboard():
    artworks = db.session.execute(select(SavedArt).order_by(SavedArt.position.asc(), SavedArt.saved_id.asc())).scalars().all()
    about_row = db.session.get(AboutPage, 1)
    return render_template("admin_dashboard.html", artworks=artworks, about=about_row)

@app.route("/about")
def about():
    about_row = db.session.get(AboutPage, 1)
    return render_template("about.html", about=about_row)

@app.route("/admin/about/update", methods=["POST"])
@login_required
def update_about():
    header = request.form.get("about_header", "").strip()
    body = request.form.get("about_body", "").strip()

    about_row = db.session.get(AboutPage, 1)
    if not about_row:
        about_row = AboutPage(id=1)

    about_row.header = header
    about_row.body = body

    db.session.add(about_row)
    db.session.commit()

    flash("About page updated!", "success")
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/art/<int:art_id>/delete", methods=["POST"])
@login_required
def delete_art(art_id):
    art = db.session.get(SavedArt, art_id)
    if not art:
        flash("Artwork not found.", "danger")
        return redirect(url_for("admin_dashboard"))

    if art.image:
        path = os.path.join(app.config["UPLOAD_FOLDER"], art.image)
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            pass

    db.session.delete(art)
    db.session.commit()
    flash("Artwork deleted.", "success")
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/art/<int:art_id>/update", methods=["POST"])
@login_required
def update_art(art_id):
    art = db.session.get(SavedArt, art_id)
    if not art:
        flash("Artwork not found.", "danger")
        return redirect(url_for("admin_dashboard"))

    art.title = request.form.get("title")
    art.medium = request.form.get("medium")
    art.description = request.form.get("description")

    file = request.files.get("art_file")
    if file and file.filename:
        if not allowed_file(file.filename):
            flash("Only JPG, PNG, WEBP, or GIF images are allowed.", "danger")
            return redirect(url_for("admin_dashboard"))

        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"

        file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

        if art.image:
            old_path = os.path.join(app.config["UPLOAD_FOLDER"], art.image)
            try:
                if os.path.exists(old_path):
                    os.remove(old_path)
            except Exception:
                pass

        art.image = filename

    db.session.commit()
    flash("Artwork updated.", "success")
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/art/reorder", methods=["POST"])
@login_required
def reorder_art():
    data = request.get_json(silent=True) or {}
    order = data.get("order", [])

    for idx, art_id in enumerate(order):
        art = db.session.get(SavedArt, int(art_id))
        if art:
            art.position = idx

    db.session.commit()
    return jsonify(ok=True)

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "success")
    return redirect(url_for("home"))

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
    
    template = "home"
    if request.endpoint == "userlogin":
        template = "userlogin"

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
            flash(f"Welcome back!", "success")
            return redirect(url_for("admin_dashboard"))
        else:
            flash("Error: Incorrect email or password", "danger")
            return redirect(url_for("userlogin"))

    return render_template("admin_login.html")

def check_password(password):
    reg = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#%()])[A-Za-z\d@$#%()]{6,20}$"
    
    pattern = re.compile(reg)
    
    is_valid = re.search(pattern, password)
    
    if is_valid:
        return True
    else:
        return False

# save uploaded image to static folder
@app.route("/upload", methods = ['POST'])
@login_required
def upload_art():
    title = request.form.get('title')
    description = request.form.get('description')
    file = request.files.get('art_file')
    medium = request.form.get('medium')


    # if file and file.filename != '':
    #     filename = secure_filename(file.filename)
    #     file.save(os.path.join(app.config['UPLOAD_FOLDER'],filename))

    #limit file types for upload
    if not file or file.filename == "":
        flash("Upload failed. Please select an image.", "danger")
        return redirect(url_for("admin_dashboard"))

    if not allowed_file(file.filename):
        flash("Upload failed. Only JPG, PNG, WEBP, or GIF images are allowed.", "danger")
        return redirect(url_for("admin_dashboard"))

    filename = secure_filename(file.filename)

    # prevent overwriting existing file w same name
    name, ext = os.path.splitext(filename)
    filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"

    file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
        #save to db
    new_entry = SavedArt (
        title = title,
        description = description,
        image = filename,
        medium = medium
    )
    db.session.add(new_entry)
    db.session.commit()

    flash("Artwork uploaded successfully!", "success")
    return redirect(url_for('admin_dashboard'))
    
    # flash("Upload failed. Please select a valid image file (jpg, jpeg, png, webp, gif).", "danger")
    # return redirect(url_for("admin_dashboard"))
    # return "Upload failed", 400

   
if __name__ == "__main__":
    app.run(debug=True)
