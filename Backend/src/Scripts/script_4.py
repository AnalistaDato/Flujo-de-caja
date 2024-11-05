import pandas as pd
from sqlalchemy.sql import text
from datetime import date, timedelta
from db import get_engine

# Función para obtener el saldo final del día anterior
def get_previous_day_balance(engine, yesterday, empresa, conf_banco):
    # Intentar buscar el saldo inicial del día anterior
    query_inicial = f"""
    SELECT total_en_divisa
    FROM facturas
    WHERE fecha_vencimiento = '{yesterday}' 
    AND empresa = '{empresa}' 
    AND conf_banco = '{conf_banco}'
    AND tipo_transaccion = 'SALDO INICIAL'
    """
    print(f"Buscando saldo inicial del día anterior: {query_inicial}")
    result_inicial = pd.read_sql(query_inicial, engine)
    
    if not result_inicial.empty:
        return result_inicial["total_en_divisa"].iloc[0]

    # Si no se encuentra el saldo inicial, buscar el saldo final del día anterior
    query_final = f"""
    SELECT total_en_divisa
    FROM facturas
    WHERE fecha_vencimiento = '{yesterday}' 
    AND empresa = '{empresa}' 
    AND conf_banco = '{conf_banco}'
    AND tipo_transaccion = 'SALDO FINAL'
    """
    print(f"Saldo inicial no encontrado. Buscando saldo final del día anterior: {query_final}")
    result_final = pd.read_sql(query_final, engine)
    
    if not result_final.empty:
        return result_final["total_en_divisa"].iloc[0]
    
    # Si no hay saldo inicial ni saldo final, calcular saldo inicial con las transacciones previas
    print(f"Ni saldo inicial ni final encontrados. Calculando saldo basado en transacciones previas.")
    df = fetch_data_from_db(empresa, conf_banco, engine)
    
    # Si no hay transacciones previas, devolver un saldo inicial predeterminado (por ejemplo, 0)
    if df.empty:
        print(f"No hay transacciones previas. Estableciendo saldo inicial predeterminado de 0.")
        return 0
    
    saldo_final = df["total_en_divisa"].sum()  # Calcular el saldo basado en las transacciones
    insert_balance(engine, yesterday, saldo_final, empresa, conf_banco, "SALDO FINAL")  # Guardar como saldo final del día anterior
    return saldo_final


# Función para insertar saldos en la base de datos
def insert_balance(engine, fecha, amount, empresa, conf_banco, transaction_type):
    query = text(""" 
    INSERT INTO facturas (numero, nombre_socio, fecha_factura, fecha_vencimiento, total_en_divisa, empresa, conf_banco, tipo_transaccion)
    VALUES (:numero, :nombre_socio, :fecha_factura, :fecha_vencimiento, :total_en_divisa, :empresa, :conf_banco, :tipo_transaccion)
    """)
    print(f"Inserting balance: {amount} for {empresa} on {fecha}")
    
    with engine.connect() as conn:
        try:
            result = conn.execute(query, {
                'numero': '',
                'nombre_socio': transaction_type,
                'fecha_factura': fecha,
                'fecha_vencimiento': fecha,
                'total_en_divisa': amount,
                'empresa': empresa,
                'conf_banco': conf_banco,
                'tipo_transaccion': ''
            })
            conn.commit()  # Agrega este commit aquí
            print(f"Inserted balance for {empresa}, {conf_banco} on {fecha}: {amount}, result: {result.rowcount} rows affected.")
        except Exception as e:
            print(f"Error inserting balance: {e}")


def classify_and_update_transactions(engine, df, empresa, conf_banco):
    tipo_transacciones = []
    for _, row in df.iterrows():
        nombre_socio_upper = row["nombre_socio"].strip().upper()
        
        if nombre_socio_upper == "SALDO FINAL" or nombre_socio_upper == "SALDO INICIAL":
            tipo_transacciones.append(nombre_socio_upper)  # Mantener el tipo de saldo
        else:
            tipo_transacciones.append("Ingreso" if row["total_en_divisa"] >= 0 else "Egreso")

    df['tipo_transaccion'] = tipo_transacciones

    with engine.connect() as conn:
        for _, row in df.iterrows():
            print(f"Preparing to update id {row['id']} with nombre_socio: {row['nombre_socio']}, tipo_transaccion: {row['tipo_transaccion']}")
            query = text(""" 
            UPDATE facturas
            SET nombre_socio = :nombre_socio, tipo_transaccion = :tipo_transaccion
            WHERE id = :id
            AND empresa = :empresa
            AND conf_banco = :conf_banco
            """)
            try:
                result = conn.execute(query, {
                    'nombre_socio': row['nombre_socio'],
                    'tipo_transaccion': row['tipo_transaccion'],
                    'id': row['id'],
                    'empresa': empresa,
                    'conf_banco': conf_banco
                })
                conn.commit()  # Comitear los cambios después de cada actualización
                if result.rowcount == 0:
                    print(f"No rows updated for id {row['id']}. Possible data issue.")
                else:
                    print(f"Updated transaction for id {row['id']} in {empresa}, {conf_banco}")
            except Exception as e:
                print(f"Error updating transaction for id {row['id']}: {e}")




# Función para generar el saldo inicial del día actual
def generate_today_initial_balance(engine, today, empresa, conf_banco):
    yesterday = today - timedelta(days=1)
    previous_balance = get_previous_day_balance(engine, yesterday, empresa, conf_banco)
    
    # Insertar saldo inicial para el día de hoy (usando saldo final o inicial del día anterior)
    insert_balance(engine, today, previous_balance, empresa, conf_banco, "SALDO INICIAL")
    
    return previous_balance

# Función para generar los saldos finales del día actual
def generate_today_final_balance(df, today):
    return df[df["fecha_vencimiento"] == today]["total_en_divisa"].sum()

# Función para conectar a la base de datos y extraer datos
def fetch_data_from_db(empresa, conf_banco, engine):
    query = f"""
    SELECT id, numero, nombre_socio, fecha_factura, fecha_vencimiento, total_en_divisa, empresa, estado_pago, conf_banco
    FROM facturas
    WHERE empresa = '{empresa}' AND conf_banco = '{conf_banco}'
    """
    print(f"Fetching data from db for {empresa}, {conf_banco}: {query}")
    df = pd.read_sql(query, engine)
    if df.empty:
        print(f"No data found for {empresa}, {conf_banco}")
    return df

# Función principal
def main():
    today = date.today()
    engine = get_engine()

    # Verificar conexión
    try:
        engine.connect()
        print("Connected to the database successfully.")
    except Exception as e:
        print(f"Failed to connect to the database: {e}")
        return

    df = pd.read_sql("SELECT DISTINCT empresa, conf_banco FROM facturas", engine)

    for _, row in df.iterrows():
        empresa = row['empresa']
        conf_banco = row['conf_banco']

        # Verificar que empresa y conf_banco no sean nulos o vacíos
        if not empresa or not conf_banco:
            print(f"Skipping invalid empresa/conf_banco: {empresa}, {conf_banco}")
            continue

        # Generar saldo inicial para hoy
        saldo_inicial = generate_today_initial_balance(engine, today, empresa, conf_banco)

        # Obtener datos del día actual
        df_data = fetch_data_from_db(empresa, conf_banco, engine)

        # Verificar si df_data contiene datos
        if df_data.empty:
            print(f"No transactions found for {empresa}, {conf_banco}. Skipping updates.")
            continue

        # NO generar saldo final del día actual
        # Solo se clasificarán las transacciones del día actual, pero sin saldo final.
        classify_and_update_transactions(engine, df_data, empresa, conf_banco)

if __name__ == "__main__":
    main()
