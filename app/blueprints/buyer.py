
from flask import Blueprint, render_template, request, flash
from flask_login import login_required, current_user
from app import db

buyer_bp = Blueprint('buyer', __name__, url_prefix='/buyer')

@buyer_bp.route('/buy', methods=['GET', 'POST'])
@login_required
def buy():
	if current_user.role != 'buyer':
		flash('Acceso denegado', 'danger')
		return render_template('base.html')
	from app.models.raffle import Raffle
	raffles = Raffle.query.all()
	# Generar diccionario de boletas disponibles por rifa
	boletas_por_rifa = {}
	raffles_dict = []
	for raffle in raffles:
		boletas_por_rifa[raffle.id] = raffle.get_boletas_disponibles()
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
		raffle_id = int(request.form['raffle_id'])
		payment_method = request.form['payment_method']
		from app.models.ticket import Ticket
		from datetime import datetime
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
				seller_id=None,
				buyer_id=current_user.id,
				is_sold=True,
				sold_at=datetime.utcnow(),
				payment_method=payment_method
			)
			db.session.add(ticket)
			created_tickets.append(ticket)
		db.session.commit()
		flash(f'Compra registrada: {len(created_tickets)} boletas', 'success')
	return render_template('buyer/buy.html', raffles=raffles, boletas_por_rifa=boletas_por_rifa, raffles_json=raffles_dict)

@buyer_bp.route('/')
@login_required
def dashboard():
	if current_user.role != 'buyer':
		flash('Acceso denegado', 'danger')
		return render_template('base.html')
	from app.models.ticket import Ticket
	from app.models.prize import Prize
	from app.models.raffle import Raffle
	from sqlalchemy import func
	tickets = Ticket.query.filter_by(buyer_id=current_user.id, is_sold=True).all()
	tickets_bought = len(tickets)
	total_paid = db.session.query(
		func.coalesce(func.sum(Raffle.valor), 0)
	).select_from(Ticket).join(Raffle, Ticket.raffle_id == Raffle.id).filter(
		Ticket.buyer_id == current_user.id,
		Ticket.is_sold == True
	).scalar() or 0
	prizes_won = 0
	prizes_detail = []
	for ticket in tickets:
		prizes = getattr(ticket, 'prizes', [])
		prizes_won += len(prizes)
		for prize in prizes:
			prizes_detail.append({
				'name': prize.name,
				'description': prize.description,
				'raffle': prize.raffle.name if prize.raffle else '',
				'awarded_at': prize.awarded_at.strftime('%Y-%m-%d') if prize.awarded_at else ''
			})
	stats = {
		'tickets_bought': tickets_bought,
		'total_paid': total_paid,
		'prizes_won': prizes_won
	}
	return render_template('buyer/dashboard.html', stats=stats, prizes_detail=prizes_detail)

@buyer_bp.route('/reports')
@login_required
def reports():
	if current_user.role != 'buyer':
		flash('Acceso denegado', 'danger')
		return render_template('base.html')
	from app.models.ticket import Ticket
	from sqlalchemy import func
	start_date = request.args.get('start_date')
	end_date = request.args.get('end_date')
	query = Ticket.query.filter_by(buyer_id=current_user.id, is_sold=True)
	if start_date:
		query = query.filter(Ticket.sold_at >= start_date)
	if end_date:
		query = query.filter(Ticket.sold_at <= end_date)
	tickets = query.all()
	from collections import defaultdict
	report_dict = defaultdict(lambda: {'tickets_bought': 0, 'prizes_won': 0})
	for ticket in tickets:
		date_str = ticket.sold_at.strftime('%Y-%m-%d') if ticket.sold_at else 'Sin fecha'
		report_dict[date_str]['tickets_bought'] += 1
		# Aquí podrías sumar premios ganados si tienes esa lógica
	report_data = []
	for date, data in sorted(report_dict.items()):
		data['date'] = date
		report_data.append(data)
	return render_template('buyer/reports.html', report_data=report_data)
