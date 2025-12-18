from artwork import db
from app import app

def main():
    with app.app_context():
        db.create_all()
if __name__ == "__main__":        
    main()