from flask import current_app
from flask_mail import Mail
# --- IMPORTS Y DEFINICIÓN DE BLUEPRINT AL INICIO ---
from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
from app.models.user import User
from app.models.raffle import Raffle
from app.models.seller import Seller
import re
import io, csv
from app import db

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Gestión de Usuarios Generales
@admin_bp.route('/users')
@login_required
def users():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	page = request.args.get('page', 1, type=int)
	q = request.args.get('q', '').strip()
	query = User.query
	if q:
		like = f"%{q}%"
		query = query.filter((User.username.ilike(like)) | (User.email.ilike(like)) | (User.role.ilike(like)))
	total = query.count()
	PER_PAGE = 10
	items = query.order_by(User.id.desc()).offset((page-1)*PER_PAGE).limit(PER_PAGE).all()

	class Pagination:
		def __init__(self, items, page, per_page, total):
			self.items = items
			self.page = page
			self.per_page = per_page
			self.total = total
			self.pages = (total // per_page) + (1 if total % per_page else 0)
			self.has_prev = page > 1
			self.has_next = page < self.pages
			self.prev_num = page-1
			self.next_num = page+1

	users_paginated = Pagination(items, page, PER_PAGE, total)
	return render_template('admin/users.html', users=users_paginated, q=q)

@admin_bp.route('/users/create', methods=['GET', 'POST'])
@login_required
def create_user():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	if request.method == 'POST':
		username = request.form['username']
		email = request.form['email']
		role = request.form['role']
		is_active = bool(int(request.form['is_active']))
		password_raw = request.form['password']
		if not password_raw:
			flash('La contraseña es obligatoria.', 'danger')
			return render_template('admin/user_form.html', user=None)
		password = generate_password_hash(password_raw)
		user = User(username=username, email=email, role=role, is_active=is_active, password_hash=password)
		db.session.add(user)
		db.session.commit()
		flash('Usuario creado correctamente.', 'success')
		return redirect(url_for('admin.users'))
	return render_template('admin/user_form.html', user=None)

@admin_bp.route('/users/edit/<int:user_id>', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	user = User.query.get_or_404(user_id)
	if request.method == 'POST':
		user.username = request.form['username']
		user.email = request.form['email']
		user.role = request.form['role']
		user.is_active = bool(int(request.form['is_active']))
		password_raw = request.form.get('password')
		if password_raw:
			user.password_hash = generate_password_hash(password_raw)
		db.session.commit()
		flash('Usuario actualizado', 'success')
		return redirect(url_for('admin.users'))
	return render_template('admin/user_form.html', user=user)

@admin_bp.route('/users/delete/<int:user_id>')
@login_required
def delete_user(user_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	user = User.query.get_or_404(user_id)
	db.session.delete(user)
	db.session.commit()
	flash('Usuario eliminado', 'info')
	return redirect(url_for('admin.users'))

@admin_bp.route('/users/activate/<int:user_id>')
@login_required
def activate_user(user_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	user = User.query.get_or_404(user_id)
	user.is_active = True
	db.session.commit()
	flash('Usuario activado', 'success')
	return redirect(url_for('admin.users'))
# Dashboard Admin
@admin_bp.route('/', endpoint='dashboard')
@login_required
def dashboard():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	# Obtener datos reales desde la base de datos
	from app.models.ticket import Ticket
	# Totales
	tickets_sold = Ticket.query.filter_by(is_sold=True).count()
	tickets_pending = Ticket.query.filter_by(is_sold=False).count()
	# Rifas activas
	try:
		active_raffles = Raffle.query.filter_by(active=True).count()
	except Exception:
		active_raffles = Raffle.query.count()
	# Vendedores y conteos por vendedor
	sellers = User.query.filter_by(role='seller').order_by(User.id).all()
	# Preferir campo `nombre` si está disponible, sino `username`
	labels = [getattr(s, 'nombre', s.username) for s in sellers]
	tickets_by_seller = [Ticket.query.filter_by(seller_id=s.id, is_sold=True).count() for s in sellers]
	stats = {
		'tickets_sold': tickets_sold,
		'tickets_pending': tickets_pending,
		'active_raffles': active_raffles,
		'active_sellers': len(sellers),
		'labels': labels,
		'tickets_by_seller': tickets_by_seller
	}
	return render_template('admin/dashboard.html', stats=stats)

# Reportes
@admin_bp.route('/reports')
@login_required
def reports():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	from app.models.ticket import Ticket
	from app.models.commission import Commission
	from app.models.user import User
	from sqlalchemy import func
	# Filtros de fecha
	start_date = request.args.get('start_date')
	end_date = request.args.get('end_date')
	# Consulta principal para agregados
	query = (
		db.session.query(
			User.id.label('seller_id'),
			User.username.label('seller'),
			func.count(Ticket.id).label('tickets_sold'),
			func.coalesce(func.sum(Commission.amount), 0).label('commission'),
			func.max(Commission.paid).label('commission_paid')
		)
		.join(Ticket, Ticket.seller_id == User.id)
		.outerjoin(Commission, Commission.seller_id == User.id)
		.filter(User.role == 'seller')
		.filter(Ticket.is_sold == True)
	)
	if start_date:
		from datetime import datetime
		try:
			start_dt = datetime.strptime(start_date, '%Y-%m-%d')
			query = query.filter(Ticket.sold_at >= start_dt)
		except Exception:
			pass
	if end_date:
		from datetime import datetime, timedelta
		try:
			end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
			query = query.filter(Ticket.sold_at < end_dt)
		except Exception:
			pass
	query = query.group_by(User.id)
	report_data = []
	for row in query:
		# Obtener los números de rifas vendidas por este vendedor y filtro de fechas
		ticket_query = Ticket.query.filter_by(seller_id=row.seller_id, is_sold=True)
		if start_date:
			from datetime import datetime
			try:
				start_dt = datetime.strptime(start_date, '%Y-%m-%d')
				ticket_query = ticket_query.filter(Ticket.sold_at >= start_dt)
			except Exception:
				pass
		if end_date:
			from datetime import datetime, timedelta
			try:
				end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
				ticket_query = ticket_query.filter(Ticket.sold_at < end_dt)
			except Exception:
				pass
		numeros = [t.number for t in ticket_query.all()]
		status = 'Pagado' if row.commission_paid else 'Pendiente'
		report_data.append({
			'seller': row.seller,
			'tickets_sold': row.tickets_sold,
			'commission': row.commission,
			'commission_status': status,
			'numbers': ', '.join(numeros) if numeros else ''
		})
	return render_template('admin/reports.html', report_data=report_data)

# Notificaciones
@admin_bp.route('/notifications', methods=['GET', 'POST'])
@login_required
def notifications():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	if request.method == 'POST':
		user_id = request.form['user_id']
		message = request.form['message']
		# Aquí se llamaría a la función de notificación (email, push, etc.)
		flash(f'Notificación enviada a usuario {user_id}', 'success')
	return render_template('admin/notifications.html')


@admin_bp.route('/notifications/log')
@login_required
def notifications_log():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	from app.models.notification import Notification
	from app.models.raffle import Raffle
	from app.models.buyer import Buyer

	page = request.args.get('page', 1, type=int)
	raffle_id = request.args.get('raffle_id', type=int)
	buyer_id = request.args.get('buyer_id', type=int)
	q = request.args.get('q', '').strip()

	query = Notification.query
	if raffle_id:
		query = query.filter(Notification.raffle_id == raffle_id)
	if buyer_id:
		query = query.filter(Notification.buyer_id == buyer_id)
	if q:
		like = f"%{q}%"
		query = query.filter(Notification.message.ilike(like))

	total = query.count()
	PER_PAGE = 10
	items = query.order_by(Notification.sent_at.desc().nullslast() if hasattr(Notification.sent_at, 'desc') else Notification.sent_at.desc()).offset((page-1)*PER_PAGE).limit(PER_PAGE).all()

	# cargar datos auxiliares para mostrar nombres
	raffles = Raffle.query.order_by(Raffle.id.desc()).all()
	buyers = Buyer.query.order_by(Buyer.id.desc()).all()
	raffle_map = {r.id: r for r in raffles}
	buyer_map = {b.id: b for b in buyers}

	class Pagination:
		def __init__(self, items, page, per_page, total):
			self.items = items
			self.page = page
			self.per_page = per_page
			self.total = total
			self.pages = (total // per_page) + (1 if total % per_page else 0)
			self.has_prev = page > 1
			self.has_next = page < self.pages
			self.prev_num = page-1
			self.next_num = page+1

	notifications_paginated = Pagination(items, page, PER_PAGE, total)
	return render_template('admin/notifications_log.html', notifications=notifications_paginated, raffles=raffles, buyers=buyers, raffle_map=raffle_map, buyer_map=buyer_map, raffle_id=raffle_id, buyer_id=buyer_id, q=q)
# Gestión de Vendedores
@admin_bp.route('/sellers')
@login_required
def sellers():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	page = request.args.get('page', 1, type=int)
	q = request.args.get('q', '').strip()
	query = Seller.query
	if q:
		like = f"%{q}%"
		query = query.filter((Seller.nombre.ilike(like)) | (Seller.email.ilike(like)) | (Seller.identificacion.ilike(like)))
	total = query.count()
	PER_PAGE = 10
	items = query.order_by(Seller.id.desc()).offset((page-1)*PER_PAGE).limit(PER_PAGE).all()

	class Pagination:
		def __init__(self, items, page, per_page, total):
			self.items = items
			self.page = page
			self.per_page = per_page
			self.total = total
			self.pages = (total // per_page) + (1 if total % per_page else 0)
			self.has_prev = page > 1
			self.has_next = page < self.pages
			self.prev_num = page-1
			self.next_num = page+1

	sellers_paginated = Pagination(items, page, PER_PAGE, total)
	return render_template('admin/sellers.html', sellers=sellers_paginated, q=q)

@admin_bp.route('/sellers/create', methods=['GET', 'POST'])
@login_required
def create_seller():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	if request.method == 'POST':
		identificacion = request.form.get('identificacion')
		nombre = request.form.get('nombre')
		direccion = request.form.get('direccion')
		telefono = request.form.get('telefono')
		email = request.form.get('email')
		tratamiento = bool(request.form.get('tratamiento_datos'))
		estado = request.form.get('estado') or 'activo'
		# Validaciones básicas
		errors = []
		if not nombre or not nombre.strip():
			errors.append('El nombre es obligatorio.')
		if not email or not re.match(r'[^@]+@[^@]+\.[^@]+', email):
			errors.append('Email inválido.')
		existing = Seller.query.filter_by(email=email).first()
		if existing:
			errors.append('El email ya está registrado para otro vendedor.')
		if errors:
			for e in errors:
				flash(e, 'danger')
			return render_template('admin/seller_form.html', seller=None)
		seller = Seller(
			identificacion=identificacion,
			nombre=nombre,
			direccion=direccion,
			telefono=telefono,
			email=email,
			tratamiento_datos=tratamiento,
			estado=estado
		)
		db.session.add(seller)
		db.session.commit()
		flash('Vendedor creado correctamente.', 'success')
		return redirect(url_for('admin.sellers'))
	return render_template('admin/seller_form.html', seller=None)

@admin_bp.route('/sellers/edit/<int:seller_id>', methods=['GET', 'POST'])
@login_required
def edit_seller(seller_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	seller = Seller.query.get_or_404(seller_id)
	if request.method == 'POST':
		identificacion = request.form.get('identificacion')
		nombre = request.form.get('nombre')
		direccion = request.form.get('direccion')
		telefono = request.form.get('telefono')
		email = request.form.get('email')
		tratamiento = bool(request.form.get('tratamiento_datos'))
		estado = request.form.get('estado') or seller.estado
		# Validaciones
		errors = []
		if not nombre or not nombre.strip():
			errors.append('El nombre es obligatorio.')
		if not email or not re.match(r'[^@]+@[^@]+\.[^@]+', email):
			errors.append('Email inválido.')
		existing = Seller.query.filter_by(email=email).first()
		if existing and existing.id != seller.id:
			errors.append('El email ya está registrado para otro vendedor.')
		if errors:
			for e in errors:
				flash(e, 'danger')
			return render_template('admin/seller_form.html', seller=seller)
		seller.identificacion = identificacion
		seller.nombre = nombre
		seller.direccion = direccion
		seller.telefono = telefono
		seller.email = email
		seller.tratamiento_datos = tratamiento
		seller.estado = estado
		db.session.commit()
		flash('Vendedor actualizado', 'success')
		return redirect(url_for('admin.sellers'))
	return render_template('admin/seller_form.html', seller=seller)

@admin_bp.route('/sellers/delete/<int:seller_id>')
@login_required
def delete_seller(seller_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	seller = Seller.query.get_or_404(seller_id)
	db.session.delete(seller)
	db.session.commit()
	flash('Vendedor eliminado', 'info')
	return redirect(url_for('admin.sellers'))


@admin_bp.route('/sellers/export')
@login_required
def export_sellers():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	sellers = Seller.query.order_by(Seller.id).all()
	si = io.StringIO()
	writer = csv.writer(si)
	writer.writerow(['id', 'identificacion', 'nombre', 'direccion', 'telefono', 'email', 'tratamiento_datos', 'estado'])
	for s in sellers:
		writer.writerow([s.id, s.identificacion or '', s.nombre or '', s.direccion or '', s.telefono or '', s.email or '', 'Sí' if s.tratamiento_datos else 'No', s.estado or ''])
	output = make_response(si.getvalue())
	output.headers['Content-Disposition'] = 'attachment; filename=sellers.csv'
	output.headers['Content-Type'] = 'text/csv; charset=utf-8'
	return output

# Gestión de Compradores
@admin_bp.route('/buyers')
@login_required
def buyers():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	page = request.args.get('page', 1, type=int)
	q = request.args.get('q', '').strip()
	from app.models.buyer import Buyer as BuyerModel
	# Base query: users with role buyer, left join buyer data
	query = User.query.filter_by(role='buyer').outerjoin(BuyerModel, User.id == BuyerModel.user_id)
	if q:
		like = f"%{q}%"
		query = query.filter(
			(User.username.ilike(like)) |
			(User.email.ilike(like)) |
			(BuyerModel.nombre.ilike(like)) |
			(BuyerModel.identificacion.ilike(like))
		)
	total = query.count()
	PER_PAGE = 10
	items = query.order_by(User.id.desc()).offset((page-1)*PER_PAGE).limit(PER_PAGE).all()

	class Pagination:
		def __init__(self, items, page, per_page, total):
			self.items = items
			self.page = page
			self.per_page = per_page
			self.total = total
			self.pages = (total // per_page) + (1 if total % per_page else 0)
			self.has_prev = page > 1
			self.has_next = page < self.pages
			self.prev_num = page-1
			self.next_num = page+1

	buyers_paginated = Pagination(items, page, PER_PAGE, total)
	return render_template('admin/buyers.html', buyers=buyers_paginated, q=q)

@admin_bp.route('/buyers/create', methods=['GET', 'POST'])
@login_required
def create_buyer():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	if request.method == 'POST':
		# Datos para User
		email = request.form['email']
		# Generar username a partir del email (asegurar unicidad)
		base = email.split('@')[0]
		username = base
		i = 1
		while User.query.filter_by(username=username).first():
			username = f"{base}{i}"
			i += 1
		# is_active se controla fuera del formulario de creación; por defecto False
		is_active = False
		password = generate_password_hash('temporal123')
		# Crear User (registro de acceso)
		user = User(username=username, email=email, role='buyer', is_active=is_active, password_hash=password)
		db.session.add(user)
		# Datos para Buyer (datos normalizados)
		from app.models.buyer import Buyer
		identificacion = request.form.get('identificacion')
		nombre = request.form.get('nombre') or username
		direccion = request.form.get('direccion')
		telefono = request.form.get('telefono')
		buyer_data = Buyer(identificacion=identificacion, nombre=nombre, direccion=direccion, telefono=telefono, email=email)
		db.session.add(buyer_data)
		db.session.commit()
		flash('Comprador creado. Contraseña temporal: temporal123', 'success')
		return redirect(url_for('admin.buyers'))
	return render_template('admin/buyer_form.html', buyer=None)

@admin_bp.route('/buyers/edit/<int:buyer_id>', methods=['GET', 'POST'])
@login_required
def edit_buyer(buyer_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	buyer = User.query.get_or_404(buyer_id)
	# intentar obtener datos normalizados del comprador
	from app.models.buyer import Buyer as BuyerModel
	buyer_data = BuyerModel.query.filter_by(email=buyer.email).first()
	if request.method == 'POST':
		# no modificamos username desde este formulario
		buyer.email = request.form['email']
		buyer.is_active = bool(int(request.form.get('is_active', 0)))
		# actualizar o crear Buyer data
		identificacion = request.form.get('identificacion')
		nombre = request.form.get('nombre')
		direccion = request.form.get('direccion')
		telefono = request.form.get('telefono')
		if buyer_data:
			buyer_data.identificacion = identificacion
			buyer_data.nombre = nombre
			buyer_data.direccion = direccion
			buyer_data.telefono = telefono
		else:
			from app.models.buyer import Buyer as BuyerModel2
			buyer_data = BuyerModel2(identificacion=identificacion, nombre=nombre or buyer.username, direccion=direccion, telefono=telefono, email=buyer.email)
			db.session.add(buyer_data)
		db.session.commit()
		flash('Comprador actualizado', 'success')
		return redirect(url_for('admin.buyers'))
	return render_template('admin/buyer_form.html', buyer=buyer, buyer_data=buyer_data)

@admin_bp.route('/buyers/delete/<int:buyer_id>')
@login_required
def delete_buyer(buyer_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	buyer = User.query.get_or_404(buyer_id)
	db.session.delete(buyer)
	db.session.commit()
	flash('Comprador eliminado', 'info')
	return redirect(url_for('admin.buyers'))
from app.models.raffle import Raffle
# Gestión de Rifas
@admin_bp.route('/raffles')
@login_required
def raffles():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	page = request.args.get('page', 1, type=int)
	q = request.args.get('q', '').strip()
	query = Raffle.query
	if q:
		like = f"%{q}%"
		query = query.filter((Raffle.name.ilike(like)) | (Raffle.descripcion.ilike(like)))
	total = query.count()
	PER_PAGE = 10
	items = query.order_by(Raffle.id.desc()).offset((page-1)*PER_PAGE).limit(PER_PAGE).all()

	class Pagination:
		def __init__(self, items, page, per_page, total):
			self.items = items
			self.page = page
			self.per_page = per_page
			self.total = total
			self.pages = (total // per_page) + (1 if total % per_page else 0)
			self.has_prev = page > 1
			self.has_next = page < self.pages
			self.prev_num = page-1
			self.next_num = page+1

	raffles_paginated = Pagination(items, page, PER_PAGE, total)
	return render_template('admin/raffles.html', raffles=raffles_paginated, q=q)


# --- ENDPOINTS DE COMPRADORES DE RIFA Y REENVIAR CORREO ---
@admin_bp.route('/raffles/<int:raffle_id>/buyers')
@login_required
def raffle_buyers(raffle_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	from app.models.ticket import Ticket
	from app.models.user import User
	from app.models.raffle import Raffle
	page = request.args.get('page', 1, type=int)
	q = request.args.get('q', '').strip()
	raffle = Raffle.query.get_or_404(raffle_id)
	# Subconsulta: tickets vendidos de esta rifa
	ticket_query = Ticket.query.filter_by(raffle_id=raffle_id, is_sold=True)
	if q:
		ticket_query = ticket_query.join(User, Ticket.buyer_id == User.id).filter(
			(User.username.ilike(f'%{q}%')) |
			(User.email.ilike(f'%{q}%')) |
			(Ticket.number.ilike(f'%{q}%'))
		)
	ticket_query = ticket_query.order_by(Ticket.id.desc())
	# Agrupar por comprador
	buyers_map = {}
	for t in ticket_query:
		if t.buyer_id not in buyers_map:
			buyers_map[t.buyer_id] = {'user': t.buyer_id, 'numbers': []}
		buyers_map[t.buyer_id]['numbers'].append(t.number)
	buyer_ids = list(buyers_map.keys())
	buyers = {b.id: b for b in User.query.filter(User.id.in_(buyer_ids)).all()}
	# Empaquetar para paginación manual, usando siempre el User real
	buyers_data = []
	for buyer_id in buyer_ids:
		b = buyers.get(buyer_id)
		if b:
			buyers_data.append(type('BuyerObj', (), {
				'id': b.id,
				'name': (b.buyer_profile.nombre if getattr(b, 'buyer_profile', None) else b.username),
				'email': b.email,
				'numbers': buyers_map[b.id]['numbers']
			}))
	# Paginación manual
	PER_PAGE = 10
	total = len(buyers_data)
	start = (page-1)*PER_PAGE
	end = start+PER_PAGE
	class Pagination:
		def __init__(self, items, page, per_page, total):
			self.items = items
			self.page = page
			self.per_page = per_page
			self.total = total
			self.pages = (total // per_page) + (1 if total % per_page else 0)
			self.has_prev = page > 1
			self.has_next = page < self.pages
			self.prev_num = page-1
			self.next_num = page+1
	buyers_paginated = Pagination(buyers_data[start:end], page, PER_PAGE, total)
	return render_template('admin/raffle_buyers.html', raffle=raffle, buyers=buyers_paginated)

@admin_bp.route('/raffles/<int:raffle_id>/buyers/<int:buyer_id>/resend', methods=['POST'])
@login_required
def resend_buyer_email(raffle_id, buyer_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	from app.models.ticket import Ticket
	from app.models.user import User
	from app.models.raffle import Raffle
	from app.utils.email_utils import enviar_boleta_email
	raffle = Raffle.query.get_or_404(raffle_id)
	buyer = User.query.get_or_404(buyer_id)
	tickets = Ticket.query.filter_by(raffle_id=raffle_id, buyer_id=buyer_id, is_sold=True).all()
	numeros = [t.number for t in tickets]
	if not numeros:
		flash('El comprador no tiene boletas para esta rifa.', 'warning')
		return redirect(url_for('admin.raffle_buyers', raffle_id=raffle_id))
	mail = Mail(current_app)
	msg = enviar_boleta_email(
		mail,
		buyer.email,
		raffle.name,
		buyer.username,
		numeros,
		valor_total=int(raffle.valor)*len(numeros),
		fecha_caducidad=raffle.fecha_caducidad.strftime('%Y-%m-%d') if raffle.fecha_caducidad else None,
		loteria=raffle.loteria,
		descripcion=raffle.descripcion,
			imagen_url=raffle.imagen,
			responsable=raffle.responsable if hasattr(raffle, 'responsable') else None,
			telefono=raffle.telefono if hasattr(raffle, 'telefono') else None
	)
	try:
		mail.send(msg)
		flash('Correo reenviado correctamente.', 'success')
	except Exception as e:
		flash(f'Error al enviar el correo: {e}', 'danger')
	return redirect(url_for('admin.raffle_buyers', raffle_id=raffle_id))


@admin_bp.route('/raffles/<int:raffle_id>/buyers/<int:user_id>/notify', methods=['POST'])
@login_required
def notify_winner(raffle_id, user_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	from app.models.user import User
	from app.models.buyer import Buyer
	from app.models.notification import Notification
	from datetime import datetime
	from app import mail
	from flask_mail import Message
	from app.utils import notifications as push_utils

	raffle = Raffle.query.get_or_404(raffle_id)
	user = User.query.get_or_404(user_id)

	# Obtener o crear buyer (tabla buyer) relacionada
	buyer = getattr(user, 'buyer_profile', None)
	if not buyer:
		buyer = Buyer(identificacion=None, nombre=user.username or user.email.split('@')[0], direccion=None, telefono=None, email=user.email, user_id=user.id)
		db.session.add(buyer)
		db.session.commit()

	# Mensaje por defecto
	message_text = f"¡Felicidades {buyer.nombre}! Has sido el ganador de la rifa '{raffle.name}'. Por favor contacta al responsable: {raffle.responsable or 'N/A'} - {raffle.telefono or ''}."

	# Enviar email
	email_sent = False
	email_error = None
	try:
		msg = Message(f"Has sido el ganador: {raffle.name}", sender=current_app.config.get('MAIL_USERNAME'), recipients=[buyer.email])
		html = f"<p>{message_text}</p>"
		if raffle.imagen:
			html = f'<div><img src="{raffle.imagen}" style="max-width:300px;"/></div>' + html
		msg.html = html
		msg.body = message_text
		mail.send(msg)
		email_sent = True
	except Exception as e:
		email_error = str(e)
		flash(f'Error enviando email: {e}', 'warning')

	# Intentar push si existe subscription en buyer (campo opcional)
	try:
		subscription = getattr(buyer, 'push_subscription', None)
		if subscription:
			push_utils.send_push_notification(subscription, message_text)
	except Exception as e:
		# Registrar el error de push junto al error de email
		if email_error:
			email_error = f"{email_error} | push_error: {e}"
		else:
			email_error = str(e)

	# Desactivar la rifa y guardar notificación en DB
	raffle.active = False
	# Determinar estado final según resultado de email
	final_status = 'sent' if email_sent else 'failed'
	notif = Notification(
		buyer_id=buyer.id,
		raffle_id=raffle.id,
		message=message_text,
		sent_at=datetime.utcnow(),
		status=final_status,
		error=email_error
	)
	db.session.add(notif)
	db.session.commit()

	flash('Notificación enviada y registrada.', 'success')
	return redirect(url_for('admin.raffle_buyers', raffle_id=raffle_id))

@admin_bp.route('/raffles/create', methods=['GET', 'POST'])
@login_required
def create_raffle():
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	# Loterías de Colombia (listado fijo)
	lotteries = [
		'Lotería de Bogotá',
		'Lotería de Boyacá',
		'Lotería del Cauca',
		'Lotería Cruz Roja',
		'Lotería de Cundinamarca',
		'Lotería del Huila',
		'Lotería de Manizales',
		'Extra de Colombia',
		'Lotería de Medellín',
		'Lotería del Meta',
		'Lotería del Quindío',
		'Lotería de Risaralda',
		'Lotería de Santander',
		'Lotería del Tolima',
		'Lotería del Valle'
	]

	if request.method == 'POST':
		name = request.form['name']
		descripcion = request.form.get('descripcion')
		responsable = request.form.get('responsable')
		telefono = request.form.get('telefono')
		fecha_caducidad = request.form.get('fecha_caducidad')
		loteria = request.form.get('loteria')
		imagen = request.form.get('imagen')
		commission_pct = float(request.form['commission_pct'])
		valor = request.form.get('valor')
		cantidad = request.form.get('cantidad')
		if not valor or valor.strip() == '' or float(valor) <= 0:
			flash('El campo "Valor de la rifa" es obligatorio y debe ser mayor a 0.', 'danger')
			return render_template('admin/raffle_form.html', raffle=None, lotteries=lotteries)
		if not cantidad or cantidad.strip() == '' or int(cantidad) <= 0:
			flash('El campo "Cantidad de boletas" es obligatorio y debe ser mayor a 0.', 'danger')
			return render_template('admin/raffle_form.html', raffle=None, lotteries=lotteries)
		valor = float(valor)
		cantidad = int(cantidad)
		from datetime import datetime
		fecha_caducidad_dt = None
		if fecha_caducidad:
			try:
				fecha_caducidad_dt = datetime.strptime(fecha_caducidad, '%Y-%m-%d')
			except Exception:
				flash('Fecha de caducidad inválida.', 'danger')
				return render_template('admin/raffle_form.html', raffle=None, lotteries=lotteries)
		numeracion = request.form.get('numeracion_boletas_disponibles')
		import re
		if not numeracion or not re.match(r'^\d{2,4}-\d{2,4}$', numeracion):
			flash('El rango de numeración debe tener el formato inicio-fin, ej: 0000-9999, 000-999, 00-99', 'danger')
			return render_template('admin/raffle_form.html', raffle=None, lotteries=lotteries)
		inicio, fin = numeracion.split('-')
		if int(inicio) >= int(fin):
			flash('El número inicial debe ser menor que el final.', 'danger')
			return render_template('admin/raffle_form.html', raffle=None, lotteries=lotteries)
		raffle = Raffle(
			name=name,
			descripcion=descripcion,
			responsable=responsable,
			telefono=telefono,
			fecha_caducidad=fecha_caducidad_dt,
			loteria=loteria,
			imagen=imagen,
			commission_pct=commission_pct,
			valor=valor,
			cantidad=cantidad,
			numeracion_boletas_disponibles=numeracion
		)
		db.session.add(raffle)
		db.session.commit()
		flash('Rifa creada', 'success')
		return redirect(url_for('admin.raffles'))
	return render_template('admin/raffle_form.html', raffle=None, lotteries=lotteries)

@admin_bp.route('/raffles/delete/<int:raffle_id>', methods=['POST', 'GET'])
@login_required
def delete_raffle(raffle_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('admin.raffles'))
	raffle = Raffle.query.get_or_404(raffle_id)
	db.session.delete(raffle)
	db.session.commit()
	flash('Rifa eliminada correctamente', 'success')
	return redirect(url_for('admin.raffles'))


@admin_bp.route('/raffles/toggle/<int:raffle_id>', methods=['POST'])
@login_required
def toggle_raffle(raffle_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	raffle = Raffle.query.get_or_404(raffle_id)
	raffle.active = not bool(raffle.active)
	db.session.commit()
	state = 'activada' if raffle.active else 'desactivada'
	flash(f'Rifa {state}.', 'success')
	return redirect(url_for('admin.raffles'))
@admin_bp.route('/raffles/edit/<int:raffle_id>', methods=['GET', 'POST'])
@login_required
def edit_raffle(raffle_id):
	if current_user.role != 'admin':
		flash('Acceso denegado', 'danger')
		return redirect(url_for('auth.login'))
	raffle = Raffle.query.get_or_404(raffle_id)
	# Loterías de Colombia (listado fijo)
	lotteries = [
		'Lotería de Bogotá',
		'Lotería de Boyacá',
		'Lotería del Cauca',
		'Lotería Cruz Roja',
		'Lotería de Cundinamarca',
		'Lotería del Huila',
		'Lotería de Manizales',
		'Extra de Colombia',
		'Lotería de Medellín',
		'Lotería del Meta',
		'Lotería del Quindío',
		'Lotería de Risaralda',
		'Lotería de Santander',
		'Lotería del Tolima',
		'Lotería del Valle'
	]

	if request.method == 'POST':
		raffle.name = request.form['name']
		raffle.descripcion = request.form.get('descripcion')
		raffle.responsable = request.form.get('responsable')
		raffle.telefono = request.form.get('telefono')
		fecha_caducidad = request.form.get('fecha_caducidad')
		raffle.loteria = request.form.get('loteria')
		raffle.imagen = request.form.get('imagen')
		raffle.commission_pct = float(request.form['commission_pct'])
		valor = request.form.get('valor')
		cantidad = request.form.get('cantidad')
		if not valor or valor.strip() == '' or float(valor) <= 0:
			flash('El campo "Valor de la rifa" es obligatorio y debe ser mayor a 0.', 'danger')
			return render_template('admin/raffle_form.html', raffle=raffle, lotteries=lotteries)
		if not cantidad or cantidad.strip() == '' or int(cantidad) <= 0:
			flash('El campo "Cantidad de boletas" es obligatorio y debe ser mayor a 0.', 'danger')
			return render_template('admin/raffle_form.html', raffle=raffle, lotteries=lotteries)
		raffle.valor = float(valor)
		raffle.cantidad = int(cantidad)
		numeracion = request.form.get('numeracion_boletas_disponibles')
		import re
		if not numeracion or not re.match(r'^\d{2,4}-\d{2,4}$', numeracion):
			flash('El rango de numeración debe tener el formato inicio-fin, ej: 0000-9999, 000-999, 00-99', 'danger')
			return render_template('admin/raffle_form.html', raffle=raffle, lotteries=lotteries)
		inicio, fin = numeracion.split('-')
		if int(inicio) >= int(fin):
			flash('El número inicial debe ser menor que el final.', 'danger')
			return render_template('admin/raffle_form.html', raffle=raffle, lotteries=lotteries)
		raffle.numeracion_boletas_disponibles = numeracion
		from datetime import datetime
		if fecha_caducidad:
			try:
				raffle.fecha_caducidad = datetime.strptime(fecha_caducidad, '%Y-%m-%d')
			except Exception:
				flash('Fecha de caducidad inválida.', 'danger')
				return render_template('admin/raffle_form.html', raffle=raffle, lotteries=lotteries)
		else:
			raffle.fecha_caducidad = None
		db.session.commit()
		flash('Rifa actualizada', 'success')
		return redirect(url_for('admin.raffles'))
	return render_template('admin/raffle_form.html', raffle=raffle, lotteries=lotteries)

