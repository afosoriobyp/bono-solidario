from flask import Blueprint, render_template, request, flash
from flask import jsonify
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
from app import db

seller_bp = Blueprint('seller', __name__, url_prefix='/seller')
@seller_bp.route('/sell', methods=['GET', 'POST'])
@login_required
def sell():
	if current_user.role != 'seller':
		flash('Acceso denegado', 'danger')
		return render_template('base.html')
	from app.models.raffle import Raffle
	from app.models.ticket import Ticket
	from app.models.user import User
	from app.models.commission import Commission
	from datetime import datetime
	import random
	# Mostrar solo rifas activas
	raffles = Raffle.query.filter_by(active=True).all()
	# Si no hay rifa seleccionada, mostrar cards para elegir
	raffle_id = request.args.get('raffle_id')
	if not raffle_id:
		return render_template('seller/raffle_select.html', raffles=raffles)
	# Generar diccionario de boletas disponibles por rifa
	boletas_por_rifa = {}
	raffles_dict = []
	for raffle in raffles:
		boletas_por_rifa[str(raffle.id)] = raffle.get_boletas_disponibles()
		raffles_dict.append({
			'id': raffle.id,
			'name': raffle.name,
			'descripcion': raffle.descripcion,
			'fecha_caducidad': raffle.fecha_caducidad.strftime('%Y-%m-%d') if raffle.fecha_caducidad else None,
			'loteria': raffle.loteria,
			'imagen': raffle.imagen,
			'commission_pct': raffle.commission_pct,
			'valor': raffle.valor,
			'cantidad': raffle.cantidad
		})
	if request.method == 'POST':
		buyer_email = request.form['buyer_email']
		buyer_name = request.form.get('buyer_name', '')
		buyer_phone = request.form.get('buyer_phone', '')
		buyer_address = request.form.get('buyer_address', '')
		payment_method = request.form['payment_method']
		# Guardar datos en modelo Buyer
		from app.models.buyer import Buyer
		identificacion = request.form.get('buyer_id', '').strip() or buyer_phone
		# Buscar por email o identificacion
		buyer_data = Buyer.query.filter((Buyer.email == buyer_email) | (Buyer.identificacion == identificacion)).first()
		if not buyer_data:
			buyer_data = Buyer(identificacion=identificacion, nombre=buyer_name, direccion=buyer_address, telefono=buyer_phone, email=buyer_email)
			db.session.add(buyer_data)
			db.session.commit()
		# (Opcional) seguir creando usuario User para login, si se requiere
		buyer = User.query.filter_by(email=buyer_email, role='buyer').first()
		if not buyer:
			buyer = User(username=buyer_email.split('@')[0], email=buyer_email, role='buyer', is_active=True, password_hash=generate_password_hash('temporal123'))
			db.session.add(buyer)
			db.session.commit()
		# Obtener los números seleccionados
		boletas_seleccionadas = request.form.getlist('boletas')
		created_tickets = []
		for ticket_number in boletas_seleccionadas:
			# Validar que el número no esté vendido
			existe = Ticket.query.filter_by(raffle_id=raffle_id, number=ticket_number, is_sold=True).first()
			if existe:
				continue
			ticket = Ticket(
				number=ticket_number,
				raffle_id=raffle_id,
				seller_id=current_user.id,
				buyer_id=buyer.id,
				buyer_data_id=buyer_data.id,
				is_sold=True,
				sold_at=datetime.utcnow(),
				payment_method=payment_method
			)
			db.session.add(ticket)
			created_tickets.append(ticket)
		db.session.commit()
		# Registrar comisión
		raffle = Raffle.query.get(raffle_id)
		if raffle:
			commission_amount = (raffle.commission_pct / 100.0) * len(created_tickets) * 1  # Suponiendo valor unitario 1
			commission = Commission(seller_id=current_user.id, amount=commission_amount, paid=False)
			db.session.add(commission)
			db.session.commit()
		flash(f'Venta registrada: {len(created_tickets)} boletas para {buyer.email}', 'success')
		# Enviar email con imagen de la compra
		try:
			from app import mail
			from app.utils.email_utils import enviar_boleta_email
			raffle_obj = raffle
			numeros = boletas_seleccionadas
			valor_total = len(numeros) * (raffle_obj.valor if raffle_obj else 0)
			msg = enviar_boleta_email(
				mail,
				buyer.email,
				raffle_obj.name if raffle_obj else '',
				request.form.get('buyer_name', ''),
				numeros,
				valor_total,
				fecha_caducidad=raffle_obj.fecha_caducidad.strftime('%d/%m/%Y') if raffle_obj and raffle_obj.fecha_caducidad else None,
				loteria=raffle_obj.loteria if raffle_obj else None,
				descripcion=raffle_obj.descripcion if raffle_obj else None,
				imagen_url=raffle_obj.imagen if raffle_obj and raffle_obj.imagen and (raffle_obj.imagen.startswith('http') or raffle_obj.imagen.startswith('/')) else None,
				responsable=raffle_obj.responsable if raffle_obj and hasattr(raffle_obj, 'responsable') else None,
				telefono=raffle_obj.telefono if raffle_obj and hasattr(raffle_obj, 'telefono') else None
			)
			mail.send(msg)
			flash('Se ha enviado un correo al comprador con los datos de la compra.', 'info')
		except Exception as e:
			from flask import current_app
			current_app.logger.exception("Error enviando email de boleta")
			flash(f'No se pudo enviar el correo al comprador: {str(e)}', 'danger')
	return render_template('seller/sell.html', raffles=raffles, boletas_por_rifa=boletas_por_rifa, raffles_json=raffles_dict, selected_raffle_id=raffle_id)


@seller_bp.route('/buyer_search')
@login_required
def buyer_search():
	q = request.args.get('q', '').strip()
	if not q:
		return jsonify([])
	from app.models.buyer import Buyer
	# Buscar por nombre o email (case-insensitive)
	like = f"%{q}%"
	results = Buyer.query.filter((Buyer.nombre.ilike(like)) | (Buyer.email.ilike(like))).limit(10).all()
	out = []
	for b in results:
		out.append({
			'id': b.id,
			'nombre': b.nombre,
			'email': b.email,
			'telefono': b.telefono or '',
			'direccion': b.direccion or ''
		})
	return jsonify(out)

@seller_bp.route('/')
@login_required
def dashboard():
	if current_user.role != 'seller':
		flash('Acceso denegado', 'danger')
		return render_template('base.html')
	from app.models.ticket import Ticket
	from app.models.commission import Commission
	from sqlalchemy import func
	tickets = Ticket.query.filter_by(seller_id=current_user.id, is_sold=True).all()
	tickets_sold = len(tickets)
	# Comisiones agrupadas por fecha de venta
	commissions_by_date = {}
	for ticket in tickets:
		date_str = ticket.sold_at.strftime('%Y-%m-%d') if ticket.sold_at else 'Sin fecha'
		# Buscar comisión asociada a este ticket (si existe)
		commission = Commission.query.filter_by(seller_id=current_user.id).filter(Commission.paid==False).with_entities(func.sum(Commission.amount)).scalar() or 0
		commissions_by_date.setdefault(date_str, 0)
		commissions_by_date[date_str] += commission
	total_commissions = sum(commissions_by_date.values())
	stats = {
		'tickets_sold': tickets_sold,
		'commissions': total_commissions,
		'commissions_by_date': commissions_by_date
	}
	return render_template('seller/dashboard.html', stats=stats)

@seller_bp.route('/reports')
@login_required
def reports():
	if current_user.role != 'seller':
		flash('Acceso denegado', 'danger')
		return render_template('base.html')
	from app.models.ticket import Ticket
	from app.models.commission import Commission
	from sqlalchemy import func
	start_date = request.args.get('start_date')
	end_date = request.args.get('end_date')
	query = Ticket.query.filter_by(seller_id=current_user.id, is_sold=True)
	if start_date:
		query = query.filter(Ticket.sold_at >= start_date)
	if end_date:
		query = query.filter(Ticket.sold_at <= end_date)
	tickets = query.all()
	# Agrupar por fecha de venta
	from collections import defaultdict
	report_dict = defaultdict(lambda: {'tickets_sold': 0, 'commission': 0})
	for ticket in tickets:
		date_str = ticket.sold_at.strftime('%Y-%m-%d') if ticket.sold_at else 'Sin fecha'
		report_dict[date_str]['tickets_sold'] += 1
	# Sumar comisiones por fecha (opcional, aquí solo total)
	total_commission = Commission.query.filter_by(seller_id=current_user.id).with_entities(func.sum(Commission.amount)).scalar() or 0
	report_data = []
	for date, data in sorted(report_dict.items()):
		data['date'] = date
		data['commission'] = total_commission  # Puedes mejorar para sumar por fecha si lo deseas
		report_data.append(data)
	return render_template('seller/reports.html', report_data=report_data)
