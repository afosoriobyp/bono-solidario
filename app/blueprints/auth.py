from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app import db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'POST':
		username = request.form['username']
		password = request.form['password']
		user = User.query.filter((User.username==username)|(User.email==username)).first()
		if user and check_password_hash(user.password_hash, password):
			if not user.is_active:
				flash('Usuario inactivo. Espere autorización del administrador.', 'warning')
				return redirect(url_for('auth.login'))
			login_user(user)
			flash('Bienvenido, {}!'.format(user.username), 'success')
			if user.role == 'admin':
				return redirect(url_for('admin.dashboard'))
			elif user.role == 'seller':
				return redirect(url_for('seller.dashboard'))
			elif user.role == 'buyer':
				return redirect(url_for('buyer.dashboard'))
			else:
				flash('Rol de usuario desconocido.', 'danger')
				return redirect(url_for('auth.login'))
		flash('Credenciales incorrectas', 'danger')
	return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
	if request.method == 'POST':
		username = request.form['username']
		email = request.form['email']
		password = request.form['password']
		role = request.form['role']
		if User.query.filter((User.username==username)|(User.email==email)).first():
			flash('Usuario o email ya registrado', 'danger')
			return redirect(url_for('auth.register'))
		user = User(username=username, email=email, password_hash=generate_password_hash(password), role=role, is_active=False)
		db.session.add(user)
		db.session.commit()
		flash('Registro exitoso. Espere autorización del administrador.', 'info')
		return redirect(url_for('auth.login'))
	return render_template('auth/register.html')

@auth_bp.route('/logout')
@login_required
def logout():
	logout_user()
	flash('Sesión cerrada', 'info')
	return redirect(url_for('auth.login'))
