import sqlite3
con=sqlite3.connect('instance/bonos.db')
print('PRAGMA index_list(buyer):')
for r in con.execute("PRAGMA index_list('buyer')"):
    print(r)
print('\nCOUNT buyer_data_id IS NOT NULL:')
print(con.execute("SELECT count(*) FROM ticket WHERE buyer_data_id IS NOT NULL").fetchone()[0])
print('\nSAMPLE JOIN:')
for r in con.execute('SELECT t.id,t.buyer_id,t.buyer_data_id,b.id,b.nombre,b.email FROM ticket t LEFT JOIN buyer b ON t.buyer_data_id=b.id LIMIT 5'):
    print(r)
con.close()
