from artwork import AboutPage, db, AdminUser
from app import app, bcrypt
from sqlalchemy import select


def main():
    with app.app_context():
        db.create_all()

        existing_admin = db.session.execute(select(AdminUser).where(AdminUser.email == "robert.w.smith07@gmail.com")).scalar()

        if not existing_admin:
            hashed_pwd = bcrypt.generate_password_hash("1LovePotatoes").decode('utf-8')

            new_admin = AdminUser(
                email = "robert.w.smith07@gmail.com",
                password = hashed_pwd,
                name = 'Danielle'
            )

            db.session.add(new_admin)


        existing_about = db.session.execute(select(AboutPage)).scalar_one_or_none()
        if not existing_about:
            db.session.add(
                AboutPage(
                    header="About",
                    body="Danielle Smith has the coolest middle name of all time. She also created Post-It Notes.",
                )
            )

        db.session.commit()
        
if __name__ == "__main__":        
    main()